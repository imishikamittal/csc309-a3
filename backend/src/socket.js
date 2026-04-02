'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./helpers');
const { prisma } = require('./db');

let ioInstance = null;
const socketsByAccount = new Map();

async function joinNegotiationRooms(negotiationId, userId, businessId) {
  if (!ioInstance) return;
  const room = `negotiation:${negotiationId}`;
  const userSockets = socketsByAccount.get(userId) || [];
  const businessSockets = socketsByAccount.get(businessId) || [];
  for (const socket of userSockets) {
    socket.join(room);
  }
  for (const socket of businessSockets) {
    socket.join(room);
  }
}

function emitNegotiationStarted(negotiationId, userId, businessId) {
  if (!ioInstance) return;
  ioInstance.to(`account:${userId}`).emit('negotiation:started', { negotiation_id: negotiationId });
  ioInstance.to(`account:${businessId}`).emit('negotiation:started', { negotiation_id: negotiationId });
}

function attach_sockets(server) {
  const io = new Server(server, { cors: { origin: '*' } });
  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token || typeof token !== 'string') return next(new Error('auth'));
      const decoded = jwt.verify(token, JWT_SECRET);
      const account = await prisma.account.findUnique({ where: { id: decoded.id } });
      if (!account) return next(new Error('auth'));
      socket.account = account;
      return next();
    } catch (e) {
      return next(new Error('auth'));
    }
  });

  io.on('connection', async (socket) => {
    const accountId = socket.account.id;
    socket.join(`account:${accountId}`);
    const list = socketsByAccount.get(accountId) || [];
    list.push(socket);
    socketsByAccount.set(accountId, list);

    try {
      const activeNeg = await prisma.negotiation.findFirst({
        where: {
          status: 'active',
          interest: {
            OR: [{ user_id: accountId }, { job: { business_id: accountId } }]
          }
        }
      });
      if (activeNeg) socket.join(`negotiation:${activeNeg.id}`);
    } catch (_) {}

    socket.on('negotiation:message', async (payload) => {
      if (!payload || typeof payload !== 'object') {
        socket.emit('negotiation:error', { error: 'Not authenticated', message: 'invalid payload' });
        return;
      }
      const negotiationId = Number(payload.negotiation_id);
      const text = payload.text;
      if (!Number.isInteger(negotiationId) || typeof text !== 'string') {
        socket.emit('negotiation:error', { error: 'Negotiation mismatch', message: 'invalid payload' });
        return;
      }
      const negotiation = await prisma.negotiation.findUnique({
        where: { id: negotiationId },
        include: { interest: { include: { job: true } } }
      });
      if (!negotiation || negotiation.status !== 'active') {
        socket.emit('negotiation:error', { error: 'Negotiation not found (or not active)', message: 'missing negotiation' });
        return;
      }
      const isCandidate = negotiation.interest.user_id === accountId;
      const isBusiness = negotiation.interest.job.business_id === accountId;
      if (!isCandidate && !isBusiness) {
        socket.emit('negotiation:error', { error: 'Not part of this negotiation', message: 'not a party' });
        return;
      }
      const activeForUser = isCandidate
        ? await prisma.negotiation.findFirst({ where: { status: 'active', interest: { user_id: accountId } } })
        : await prisma.negotiation.findFirst({ where: { status: 'active', interest: { job: { business_id: accountId } } } });
      if (!activeForUser || activeForUser.id !== negotiationId) {
        socket.emit('negotiation:error', { error: 'Negotiation mismatch', message: 'active negotiation mismatch' });
        return;
      }
      const message = {
        negotiation_id: negotiationId,
        sender: { role: socket.account.role, id: accountId },
        text,
        createdAt: new Date().toISOString()
      };
      io.to(`negotiation:${negotiationId}`).emit('negotiation:message', message);
    });

    socket.on('disconnect', () => {
      const remaining = (socketsByAccount.get(accountId) || []).filter((s) => s.id !== socket.id);
      if (remaining.length) socketsByAccount.set(accountId, remaining);
      else socketsByAccount.delete(accountId);
    });
  });

  return io;
}

module.exports = { attach_sockets, emitNegotiationStarted, joinNegotiationRooms };