'use strict';

const jwt = require('jsonwebtoken');
const { prisma } = require('./db');
const { config } = require('./config');

const JWT_SECRET = 'csc309-a2-secret';
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function badRequest(res, message = 'Bad Request') {
  return res.status(400).json({ error: message });
}

function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({ error: message });
}

function forbidden(res, message = 'Forbidden') {
  return res.status(403).json({ error: message });
}

function notFound(res, message = 'Not Found') {
  return res.status(404).json({ error: message });
}

function conflict(res, message = 'Conflict') {
  return res.status(409).json({ error: message });
}

function gone(res, message = 'Gone') {
  return res.status(410).json({ error: message });
}

function tooMany(res, message = 'Too Many Requests') {
  return res.status(429).json({ error: message });
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

function parseBooleanQuery(value) {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function parseIsoDateString(value) {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function isValidBirthday(value) {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value) {
  if (typeof value !== 'string') return false;
  if (value.length < 8 || value.length > 20) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
}

function onlyFields(obj, allowed) {
  return Object.keys(obj).every((k) => allowed.includes(k));
}

function pagination(query) {
  const page = query.page === undefined ? 1 : parsePositiveInt(query.page);
  const limit = query.limit === undefined ? 10 : parsePositiveInt(query.limit);
  if (!page || !limit) return null;
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

function issueToken(account) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const token = jwt.sign({ id: account.id, role: account.role, exp }, JWT_SECRET);
  return {
    token,
    expiresAt: new Date(exp * 1000).toISOString()
  };
}

async function authFromHeader(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const account = await prisma.account.findUnique({ where: { id: decoded.id } });
    if (!account) return null;
    return account;
  } catch (err) {
    return null;
  }
}

function requireAuth(roles) {
  return async (req, res, next) => {
    const account = await authFromHeader(req);
    if (!account) return unauthorized(res);
    req.account = account;
    if (roles && !roles.includes(account.role)) return forbidden(res);
    return next();
  };
}

async function tryAuth(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  return authFromHeader(req);
}

async function getRegular(id) {
  return prisma.regularProfile.findUnique({
    where: { id },
    include: { account: true }
  });
}

async function getBusiness(id) {
  return prisma.businessProfile.findUnique({
    where: { id },
    include: { account: true }
  });
}

function effectiveJobStatus(job, now) {
  if (job.status === 'canceled') return 'canceled';
  if (job.status === 'filled') return job.end_time <= now ? 'completed' : 'filled';
  if (job.start_time <= now) return 'expired';
  if (now.getTime() + config.negotiation_window * 1000 >= job.start_time.getTime()) return 'expired';
  return 'open';
}

function mapRegularPublic(regular) {
  return {
    id: regular.id,
    first_name: regular.first_name,
    last_name: regular.last_name,
    email: regular.account.email,
    activated: regular.account.activated,
    suspended: regular.suspended,
    role: 'regular',
    phone_number: regular.phone_number,
    postal_address: regular.postal_address
  };
}

function mapRegularMe(regular, now) {
  const isActive = regular.last_active_at.getTime() + config.availability_timeout * 1000 > now.getTime();
  return {
    id: regular.id,
    first_name: regular.first_name,
    last_name: regular.last_name,
    email: regular.account.email,
    activated: regular.account.activated,
    suspended: regular.suspended,
    available: Boolean(regular.available && isActive),
    role: 'regular',
    phone_number: regular.phone_number,
    postal_address: regular.postal_address,
    birthday: regular.birthday,
    createdAt: regular.account.createdAt.toISOString(),
    avatar: regular.avatar,
    resume: regular.resume,
    biography: regular.biography
  };
}

function mapBusinessPublic(business, admin) {
  const base = {
    id: business.id,
    business_name: business.business_name,
    email: business.account.email,
    role: 'business',
    phone_number: business.phone_number,
    postal_address: business.postal_address
  };
  if (admin) {
    base.owner_name = business.owner_name;
    base.verified = business.verified;
    base.activated = business.account.activated;
  }
  return base;
}

function mapBusinessDetail(business, admin) {
  const base = {
    id: business.id,
    business_name: business.business_name,
    email: business.account.email,
    role: 'business',
    phone_number: business.phone_number,
    postal_address: business.postal_address,
    location: { lon: business.lon, lat: business.lat },
    avatar: business.avatar,
    biography: business.biography
  };
  if (admin) {
    base.owner_name = business.owner_name;
    base.activated = business.account.activated;
    base.verified = business.verified;
    base.createdAt = business.account.createdAt.toISOString();
  }
  return base;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371.2;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function overlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

async function hasApprovedQualification(userId) {
  const count = await prisma.qualification.count({
    where: { user_id: userId, status: 'approved' }
  });
  return count > 0;
}

async function hasApprovedQualificationFor(userId, positionTypeId) {
  const q = await prisma.qualification.findUnique({
    where: { user_id_position_type_id: { user_id: userId, position_type_id: positionTypeId } }
  });
  return Boolean(q && q.status === 'approved');
}

async function hasConflictingCommitment(userId, startTime, endTime, now) {
  const jobs = await prisma.job.findMany({
    where: { worker_id: userId, status: 'filled' }
  });
  for (const job of jobs) {
    if (job.end_time <= now) continue;
    if (overlap(startTime, endTime, job.start_time, job.end_time)) return true;
  }
  return false;
}

async function currentActiveNegotiationForUser(userId, now) {
  const neg = await prisma.negotiation.findFirst({
    where: { status: 'active', interest: { user_id: userId } },
    include: { interest: true }
  });
  if (!neg) return null;
  if (now && neg.expiresAt <= now) return null;
  return neg;
}

async function currentActiveNegotiationForBusiness(businessId, now) {
  const neg = await prisma.negotiation.findFirst({
    where: { status: 'active', interest: { job: { business_id: businessId } } },
    include: { interest: true }
  });
  if (!neg) return null;
  if (now && neg.expiresAt <= now) return null;
  return neg;
}

async function currentActiveNegotiationForJob(jobId, now) {
  const neg = await prisma.negotiation.findFirst({
    where: { status: 'active', interest: { job_id: jobId } }
  });
  if (!neg) return null;
  if (now && neg.expiresAt <= now) return null;
  return neg;
}

async function isDiscoverable(userId, job, now) {
  const regular = await prisma.regularProfile.findUnique({ where: { id: userId }, include: { account: true } });
  if (!regular || !regular.account.activated || regular.suspended) return false;
  if (!regular.available) return false;
  if (regular.last_active_at.getTime() + config.availability_timeout * 1000 <= now.getTime()) return false;
  const qualified = await hasApprovedQualificationFor(userId, job.position_type_id);
  if (!qualified) return false;
  const conflictJob = await hasConflictingCommitment(userId, job.start_time, job.end_time, now);
  if (conflictJob) return false;
  const neg = await currentActiveNegotiationForUser(userId, now);
  if (neg) return false;
  return true;
}

async function refreshNegotiationIfExpired(negotiation, now) {
  if (!negotiation || negotiation.status !== 'active') return negotiation;
  if (negotiation.expiresAt > now) return negotiation;
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.negotiation.findUnique({ where: { id: negotiation.id }, include: { interest: true } });
    if (!current || current.status !== 'active') return current;
    if (current.expiresAt > now) return current;
    await tx.negotiation.update({ where: { id: current.id }, data: { status: 'expired' } });
    await tx.interest.update({
      where: { id: current.interest_id },
      data: { candidate_interested: null, business_interested: null }
    });
    await tx.regularProfile.update({
      where: { id: current.interest.user_id },
      data: { available: true, last_active_at: now }
    });
    return tx.negotiation.findUnique({ where: { id: current.id }, include: { interest: true } });
  });
  return updated;
}

module.exports = {
  JWT_SECRET,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  gone,
  tooMany,
  isObject,
  parsePositiveInt,
  parseBooleanQuery,
  parseIsoDateString,
  isValidBirthday,
  isValidEmail,
  isValidPassword,
  onlyFields,
  pagination,
  issueToken,
  authFromHeader,
  requireAuth,
  tryAuth,
  getRegular,
  getBusiness,
  effectiveJobStatus,
  mapRegularPublic,
  mapRegularMe,
  mapBusinessPublic,
  mapBusinessDetail,
  haversineKm,
  hasApprovedQualification,
  hasApprovedQualificationFor,
  hasConflictingCommitment,
  currentActiveNegotiationForUser,
  currentActiveNegotiationForBusiness,
  currentActiveNegotiationForJob,
  isDiscoverable,
  refreshNegotiationIfExpired
};
