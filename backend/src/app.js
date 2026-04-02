'use strict';

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('./db');
const { config, resetRequestsByIp } = require('./config');
const {
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
} = require('./helpers');
const { emitNegotiationStarted, joinNegotiationRooms } = require('./socket');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function mapWorker(worker) {
  if (!worker) return null;
  return { id: worker.id, first_name: worker.first_name, last_name: worker.last_name };
}

function mapPT(pt) {
  return { id: pt.id, name: pt.name };
}

function mapBizRef(biz) {
  return { id: biz.id, business_name: biz.business_name };
}

function mapJobBase(job) {
  return {
    id: job.id,
    status: job.status,
    position_type: mapPT(job.position_type),
    business: mapBizRef(job.business),
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    start_time: job.start_time.toISOString(),
    end_time: job.end_time.toISOString(),
    updatedAt: job.updatedAt.toISOString()
  };
}

function mapJobDetail(job) {
  return {
    ...mapJobBase(job),
    worker: mapWorker(job.worker),
    note: job.note
  };
}

function mapJobCreated(job) {
  return {
    ...mapJobBase(job),
    worker: null,
    note: job.note
  };
}

function mapJobForBusinessList(job) {
  return {
    id: job.id,
    status: job.status,
    position_type: mapPT(job.position_type),
    business_id: job.business_id,
    worker: mapWorker(job.worker),
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    start_time: job.start_time.toISOString(),
    end_time: job.end_time.toISOString(),
    updatedAt: job.updatedAt.toISOString()
  };
}

function mapJobForNegotiation(job) {
  return {
    id: job.id,
    status: job.status,
    position_type: mapPT(job.position_type),
    business: mapBizRef(job.business),
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    start_time: job.start_time.toISOString(),
    end_time: job.end_time.toISOString()
  };
}

async function saveFile(file, relPath) {
  const absolute = path.join(process.cwd(), relPath);
  await fs.promises.mkdir(path.dirname(absolute), { recursive: true });
  await fs.promises.writeFile(absolute, file.buffer);
}

function create_app() {
  const app = express();
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:5173']
    : ['http://localhost:5173'];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  app.use(express.json());
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use((req, res, next) => {
    req.now = new Date();
    next();
  });

  app.post('/users', async (req, res) => {
    const allowed = ['first_name', 'last_name', 'email', 'password', 'phone_number', 'postal_address', 'birthday'];
    if (!isObject(req.body) || !onlyFields(req.body, allowed)) return badRequest(res);
    const { first_name, last_name, email, password } = req.body;
    const phone_number = req.body.phone_number !== undefined ? req.body.phone_number : '';
    const postal_address = req.body.postal_address !== undefined ? req.body.postal_address : '';
    const birthday = req.body.birthday !== undefined ? req.body.birthday : '1970-01-01';
    if (typeof first_name !== 'string' || first_name.length === 0
      || typeof last_name !== 'string' || last_name.length === 0
      || !isValidEmail(email) || !isValidPassword(password)
      || typeof phone_number !== 'string' || typeof postal_address !== 'string'
      || !isValidBirthday(birthday)) return badRequest(res);
    const existing = await prisma.account.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Conflict' });
    const hash = await bcrypt.hash(password, 10);
    const resetToken = uuidv4();
    const expiresAt = new Date(req.now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const account = await prisma.account.create({
      data: {
        email, password_hash: hash, role: 'regular', activated: false,
        reset_token: resetToken, reset_expires: expiresAt,
        regular: { create: { first_name, last_name, phone_number, postal_address, birthday, biography: '' } }
      },
      include: { regular: true }
    });
    return res.status(201).json({
      id: account.id,
      first_name: account.regular.first_name,
      last_name: account.regular.last_name,
      email: account.email,
      activated: account.activated,
      role: account.role,
      phone_number: account.regular.phone_number,
      postal_address: account.regular.postal_address,
      birthday: account.regular.birthday,
      createdAt: account.createdAt.toISOString(),
      resetToken: account.reset_token,
      expiresAt: account.reset_expires.toISOString()
    });
  });

  app.post('/businesses', async (req, res) => {
    const allowed = ['business_name', 'owner_name', 'email', 'password', 'phone_number', 'postal_address', 'location'];
    if (!isObject(req.body) || !onlyFields(req.body, allowed)) return badRequest(res);
    const { business_name, owner_name, email, password, phone_number, postal_address, location } = req.body;
    if (typeof business_name !== 'string' || business_name.length === 0
      || typeof owner_name !== 'string' || owner_name.length === 0
      || !isValidEmail(email) || !isValidPassword(password)
      || typeof phone_number !== 'string' || typeof postal_address !== 'string'
      || !isObject(location) || typeof location.lon !== 'number' || typeof location.lat !== 'number'
      || location.lat < -90 || location.lat > 90 || location.lon < -180 || location.lon > 180) return badRequest(res);
    const existing = await prisma.account.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Conflict' });
    const hash = await bcrypt.hash(password, 10);
    const resetToken = uuidv4();
    const expiresAt = new Date(req.now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const account = await prisma.account.create({
      data: {
        email, password_hash: hash, role: 'business', activated: false,
        reset_token: resetToken, reset_expires: expiresAt,
        business: { create: { business_name, owner_name, phone_number, postal_address, lon: location.lon, lat: location.lat, biography: '' } }
      },
      include: { business: true }
    });
    return res.status(201).json({
      id: account.id,
      business_name: account.business.business_name,
      owner_name: account.business.owner_name,
      email: account.email,
      activated: account.activated,
      verified: account.business.verified,
      role: account.role,
      phone_number: account.business.phone_number,
      postal_address: account.business.postal_address,
      location: { lon: account.business.lon, lat: account.business.lat },
      createdAt: account.createdAt.toISOString(),
      resetToken: account.reset_token,
      expiresAt: account.reset_expires.toISOString()
    });
  });

  app.post('/auth/resets', async (req, res) => {
    if (!isObject(req.body) || !onlyFields(req.body, ['email']) || !isValidEmail(req.body.email)) return badRequest(res);
    const account = await prisma.account.findUnique({ where: { email: req.body.email } });
    if (!account) return notFound(res);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const last = resetRequestsByIp.get(ip);
    if (last && req.now.getTime() - last < config.reset_cooldown * 1000) return tooMany(res);
    const resetToken = uuidv4();
    const expiresAt = new Date(req.now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await prisma.account.update({
      where: { id: account.id },
      data: { reset_token: resetToken, reset_expires: expiresAt }
    });
    resetRequestsByIp.set(ip, req.now.getTime());
    return res.status(202).json({ expiresAt: expiresAt.toISOString(), resetToken });
  });

  app.post('/auth/resets/:resetToken', async (req, res) => {
    if (!isObject(req.body) || !onlyFields(req.body, ['email', 'password'])
      || typeof req.body.email !== 'string' || req.body.email.length === 0
      || (req.body.password !== undefined && !isValidPassword(req.body.password))) return badRequest(res);
    const account = await prisma.account.findFirst({ where: { reset_token: req.params.resetToken } });
    if (!account) return unauthorized(res);
    if (account.reset_expires <= req.now) return gone(res);
    if (account.email !== req.body.email) return unauthorized(res);
    const data = { activated: true, reset_token: null, reset_expires: null };
    if (req.body.password !== undefined) data.password_hash = await bcrypt.hash(req.body.password, 10);
    const updated = await prisma.account.update({ where: { id: account.id }, data, include: { regular: true, business: true } });
    return res.json({ activated: updated.activated });
  });

  app.post('/auth/tokens', async (req, res) => {
    if (!isObject(req.body) || !onlyFields(req.body, ['email', 'password'])
      || !isValidEmail(req.body.email) || typeof req.body.password !== 'string') return badRequest(res);
    const account = await prisma.account.findUnique({ where: { email: req.body.email } });
    if (!account) return res.status(401).json({ error: 'Unauthorized' });
    const valid = await bcrypt.compare(req.body.password, account.password_hash);
    if (!valid) return res.status(401).json({ error: 'Unauthorized' });
    if (!account.activated) return forbidden(res);
    return res.json(issueToken(account));
  });

  // Business self-management - these need to come before /businesses/:businessId

  app.get('/businesses/me', requireAuth(['business']), async (req, res) => {
    const business = await getBusiness(req.account.id);
    return res.json({
      id: business.id,
      business_name: business.business_name,
      owner_name: business.owner_name,
      email: business.account.email,
      role: 'business',
      phone_number: business.phone_number,
      postal_address: business.postal_address,
      location: { lon: business.lon, lat: business.lat },
      avatar: business.avatar,
      biography: business.biography,
      activated: business.account.activated,
      verified: business.verified,
      createdAt: business.account.createdAt.toISOString()
    });
  });

  app.patch('/businesses/me', requireAuth(['business']), async (req, res) => {
    const allowed = ['business_name', 'owner_name', 'phone_number', 'postal_address', 'location', 'avatar', 'biography'];
    if (!isObject(req.body) || !onlyFields(req.body, allowed) || Object.keys(req.body).length === 0) return badRequest(res);
    if ((req.body.business_name !== undefined && typeof req.body.business_name !== 'string')
      || (req.body.owner_name !== undefined && typeof req.body.owner_name !== 'string')
      || (req.body.phone_number !== undefined && typeof req.body.phone_number !== 'string')
      || (req.body.postal_address !== undefined && typeof req.body.postal_address !== 'string')
      || (req.body.avatar !== undefined && req.body.avatar !== null && typeof req.body.avatar !== 'string')
      || (req.body.biography !== undefined && typeof req.body.biography !== 'string')
      || (req.body.location !== undefined && (!isObject(req.body.location) || typeof req.body.location.lon !== 'number' || typeof req.body.location.lat !== 'number'))) return badRequest(res);
    const data = { ...req.body };
    if (req.body.location) {
      data.lon = req.body.location.lon;
      data.lat = req.body.location.lat;
      delete data.location;
    }
    const updated = await prisma.businessProfile.update({ where: { id: req.account.id }, data });
    const result = { id: updated.id };
    for (const key of Object.keys(req.body)) {
      if (key === 'location') result.location = { lon: updated.lon, lat: updated.lat };
      else result[key] = updated[key];
    }
    return res.json(result);
  });

  app.put('/businesses/me/avatar', requireAuth(['business']), upload.single('file'), async (req, res) => {
    if (!req.file || !['image/png', 'image/jpeg'].includes(req.file.mimetype)) return badRequest(res);
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const rel = `uploads/businesses/${req.account.id}/avatar.${ext}`;
    await saveFile(req.file, rel);
    const url = `/${rel}`;
    await prisma.businessProfile.update({ where: { id: req.account.id }, data: { avatar: url } });
    return res.json({ avatar: url });
  });

  app.post('/businesses/me/jobs', requireAuth(['business']), async (req, res) => {
    const allowed = ['position_type_id', 'salary_min', 'salary_max', 'start_time', 'end_time', 'note'];
    if (!isObject(req.body) || !onlyFields(req.body, allowed)) return badRequest(res);
    const { position_type_id, salary_min, salary_max, start_time, end_time } = req.body;
    const note = req.body.note !== undefined ? req.body.note : '';
    if (!Number.isInteger(position_type_id) || position_type_id <= 0
      || typeof salary_min !== 'number' || typeof salary_max !== 'number'
      || salary_min < 0 || salary_max < salary_min
      || typeof note !== 'string') return badRequest(res);
    const start = parseIsoDateString(start_time);
    const end = parseIsoDateString(end_time);
    if (!start || !end) return badRequest(res);
    if (end <= start || start <= req.now || end <= req.now) return badRequest(res);
    if (start.getTime() - req.now.getTime() > config.job_start_window * 3600 * 1000) return badRequest(res);
    if (req.now.getTime() + config.negotiation_window * 1000 >= start.getTime()) return badRequest(res);
    const position = await prisma.positionType.findUnique({ where: { id: position_type_id } });
    if (!position) return badRequest(res);
    const business = await getBusiness(req.account.id);
    if (!business.verified) return forbidden(res);
    const job = await prisma.job.create({
      data: { business_id: req.account.id, position_type_id, salary_min, salary_max, start_time: start, end_time: end, note },
      include: { position_type: true, business: true }
    });
    return res.status(201).json(mapJobCreated({ ...job, status: 'open', worker: null }));
  });

  app.get('/businesses/me/jobs', requireAuth(['business']), async (req, res) => {
    const pag = pagination(req.query);
    if (!pag) return badRequest(res);
    const where = { business_id: req.account.id };
    if (req.query.position_type_id !== undefined) {
      const id = parsePositiveInt(req.query.position_type_id);
      if (!id) return badRequest(res);
      where.position_type_id = id;
    }
    let salaryMinFilter;
    let salaryMaxFilter;
    if (req.query.salary_min !== undefined) {
      const v = Number(req.query.salary_min);
      if (Number.isNaN(v)) return badRequest(res);
      salaryMinFilter = v;
    }
    if (req.query.salary_max !== undefined) {
      const v = Number(req.query.salary_max);
      if (Number.isNaN(v)) return badRequest(res);
      salaryMaxFilter = v;
    }
    let startAfter;
    let endBefore;
    if (req.query.start_time !== undefined) {
      const v = parseIsoDateString(req.query.start_time);
      if (!v) return badRequest(res);
      startAfter = v;
    }
    if (req.query.end_time !== undefined) {
      const v = parseIsoDateString(req.query.end_time);
      if (!v) return badRequest(res);
      endBefore = v;
    }
    const validStatuses = ['open', 'expired', 'filled', 'canceled', 'completed'];
    let filterStatuses = ['open', 'filled'];
    if (req.query.status !== undefined) {
      const raw = req.query.status;
      const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw.length > 0 ? [raw] : []);
      const filtered = arr.filter((s) => validStatuses.includes(s));
      filterStatuses = filtered.length > 0 ? filtered : [];
    }
    const jobs = await prisma.job.findMany({
      where,
      include: { position_type: true, worker: true }
    });
    let filtered = jobs.map((j) => ({ ...j, status: effectiveJobStatus(j, req.now) }));
    if (salaryMinFilter !== undefined) filtered = filtered.filter((j) => j.salary_min >= salaryMinFilter);
    if (salaryMaxFilter !== undefined) filtered = filtered.filter((j) => j.salary_max >= salaryMaxFilter);
    if (startAfter !== undefined) filtered = filtered.filter((j) => j.start_time > startAfter);
    if (endBefore !== undefined) filtered = filtered.filter((j) => j.end_time < endBefore);
    filtered = filtered.filter((j) => filterStatuses.includes(j.status));
    return res.json({ count: filtered.length, results: filtered.slice(pag.skip, pag.skip + pag.take).map(mapJobForBusinessList) });
  });

  app.patch('/businesses/me/jobs/:jobId(\\d+)', requireAuth(['business']), async (req, res) => {
    const jobId = parsePositiveInt(req.params.jobId);
    if (!jobId || !isObject(req.body) || !onlyFields(req.body, ['salary_min', 'salary_max', 'start_time', 'end_time', 'note']) || Object.keys(req.body).length === 0) return badRequest(res);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.business_id !== req.account.id) return notFound(res);
    const status = effectiveJobStatus(job, req.now);
    if (status !== 'open') return conflict(res);
    const patch = {};
    if (req.body.salary_min !== undefined) {
      if (typeof req.body.salary_min !== 'number' || req.body.salary_min < 0) return badRequest(res);
      patch.salary_min = req.body.salary_min;
    }
    if (req.body.salary_max !== undefined) {
      if (typeof req.body.salary_max !== 'number') return badRequest(res);
      patch.salary_max = req.body.salary_max;
    }
    const nextSalaryMin = patch.salary_min !== undefined ? patch.salary_min : job.salary_min;
    const nextSalaryMax = patch.salary_max !== undefined ? patch.salary_max : job.salary_max;
    if (nextSalaryMax < nextSalaryMin) return badRequest(res);
    let nextStart = job.start_time;
    let nextEnd = job.end_time;
    if (req.body.start_time !== undefined) {
      const d = parseIsoDateString(req.body.start_time);
      if (!d) return badRequest(res);
      nextStart = d;
      patch.start_time = d;
    }
    if (req.body.end_time !== undefined) {
      const d = parseIsoDateString(req.body.end_time);
      if (!d) return badRequest(res);
      nextEnd = d;
      patch.end_time = d;
    }
    if (nextStart <= req.now || nextEnd <= req.now || nextEnd <= nextStart) return badRequest(res);
    if (nextStart.getTime() - req.now.getTime() > config.job_start_window * 3600 * 1000) return badRequest(res);
    if (req.now.getTime() + config.negotiation_window * 1000 >= nextStart.getTime()) return badRequest(res);
    if (req.body.note !== undefined) {
      if (typeof req.body.note !== 'string') return badRequest(res);
      patch.note = req.body.note;
    }
    const active = await currentActiveNegotiationForJob(jobId, req.now);
    if (active) {
      await prisma.negotiation.update({ where: { id: active.id }, data: { candidate_decision: null, business_decision: null } });
    }
    const updated = await prisma.job.update({ where: { id: jobId }, data: patch });
    const result = { id: updated.id, updatedAt: updated.updatedAt.toISOString() };
    if (patch.salary_min !== undefined) result.salary_min = updated.salary_min;
    if (patch.salary_max !== undefined) result.salary_max = updated.salary_max;
    if (patch.start_time !== undefined) result.start_time = updated.start_time.toISOString();
    if (patch.end_time !== undefined) result.end_time = updated.end_time.toISOString();
    if (patch.note !== undefined) result.note = updated.note;
    return res.json(result);
  });

  app.delete('/businesses/me/jobs/:jobId(\\d+)', requireAuth(['business']), async (req, res) => {
    const jobId = parsePositiveInt(req.params.jobId);
    if (!jobId) return badRequest(res);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.business_id !== req.account.id) return notFound(res);
    const status = effectiveJobStatus(job, req.now);
    if (!['open', 'expired'].includes(status)) return conflict(res);
    const active = await currentActiveNegotiationForJob(jobId, req.now);
    if (active) return conflict(res);
    await prisma.job.delete({ where: { id: jobId } });
    return res.status(204).end();
  });

  // Business public routes (admin sees a bit more)

  app.get('/businesses', async (req, res) => {
    const pag = pagination(req.query);
    if (!pag) return badRequest(res);
    let account = null;
    if (req.headers.authorization) {
      account = await tryAuth(req);
      if (!account) return unauthorized(res);
    }
    const admin = account && account.role === 'admin';
    if (!admin) {
      if (req.query.activated !== undefined || req.query.verified !== undefined || req.query.sort === 'owner_name') return badRequest(res);
    }
    const sort = req.query.sort;
    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    if (sort !== undefined && !['business_name', 'email', 'owner_name'].includes(sort)) return badRequest(res);
    const activated = req.query.activated !== undefined ? parseBooleanQuery(req.query.activated) : undefined;
    const verified = req.query.verified !== undefined ? parseBooleanQuery(req.query.verified) : undefined;
    if (activated === null || verified === null) return badRequest(res);
    const where = { account: { role: 'business' } };
    if (typeof req.query.keyword === 'string') {
      const kw = req.query.keyword;
      const orConds = [
        { business_name: { contains: kw } },
        { phone_number: { contains: kw } },
        { postal_address: { contains: kw } },
        { account: { email: { contains: kw } } }
      ];
      if (admin) orConds.push({ owner_name: { contains: kw } });
      where.OR = orConds;
    }
    if (admin && activated !== undefined) where.account = { ...where.account, activated };
    if (admin && verified !== undefined) where.verified = verified;
    const orderBy = [];
    if (sort) {
      if (sort === 'email') orderBy.push({ account: { email: order } });
      else orderBy.push({ [sort]: order });
    }
    const [count, rows] = await Promise.all([
      prisma.businessProfile.count({ where }),
      prisma.businessProfile.findMany({ where, include: { account: true }, orderBy, skip: pag.skip, take: pag.take })
    ]);
    return res.json({ count, results: rows.map((x) => mapBusinessPublic(x, admin)) });
  });

  app.get('/businesses/:businessId(\\d+)', async (req, res) => {
    const businessId = parsePositiveInt(req.params.businessId);
    if (!businessId) return badRequest(res);
    let account = null;
    if (req.headers.authorization) {
      account = await tryAuth(req);
      if (!account) return unauthorized(res);
    }
    const admin = account && account.role === 'admin';
    const business = await prisma.businessProfile.findUnique({
      where: { id: businessId },
      include: { account: true }
    });
    if (!business) return notFound(res);
    return res.json(mapBusinessDetail(business, admin));
  });

  app.patch('/businesses/:businessId(\\d+)/verified', requireAuth(['admin']), async (req, res) => {
    const businessId = parsePositiveInt(req.params.businessId);
    if (!businessId || !isObject(req.body) || !onlyFields(req.body, ['verified']) || typeof req.body.verified !== 'boolean') return badRequest(res);
    const business = await prisma.businessProfile.findUnique({ where: { id: businessId }, include: { account: true } });
    if (!business) return notFound(res);
    const updated = await prisma.businessProfile.update({ where: { id: businessId }, data: { verified: req.body.verified } });
    return res.json({
      id: updated.id,
      business_name: updated.business_name,
      owner_name: updated.owner_name,
      email: business.account.email,
      activated: business.account.activated,
      verified: updated.verified,
      role: 'business',
      phone_number: updated.phone_number,
      postal_address: updated.postal_address
    });
  });

  // User self-management

  app.get('/users/me', requireAuth(['regular']), async (req, res) => {
    const regular = await getRegular(req.account.id);
    return res.json(mapRegularMe(regular, req.now));
  });

  app.patch('/users/me', requireAuth(['regular']), async (req, res) => {
    const allowed = ['first_name', 'last_name', 'phone_number', 'postal_address', 'birthday', 'avatar', 'biography'];
    if (!isObject(req.body) || !onlyFields(req.body, allowed) || Object.keys(req.body).length === 0) return badRequest(res);
    if ((req.body.first_name !== undefined && typeof req.body.first_name !== 'string')
      || (req.body.last_name !== undefined && typeof req.body.last_name !== 'string')
      || (req.body.phone_number !== undefined && typeof req.body.phone_number !== 'string')
      || (req.body.postal_address !== undefined && typeof req.body.postal_address !== 'string')
      || (req.body.birthday !== undefined && !isValidBirthday(req.body.birthday))
      || (req.body.avatar !== undefined && req.body.avatar !== null && typeof req.body.avatar !== 'string')
      || (req.body.biography !== undefined && typeof req.body.biography !== 'string')) return badRequest(res);
    const updated = await prisma.regularProfile.update({ where: { id: req.account.id }, data: req.body });
    const result = { id: updated.id };
    for (const key of Object.keys(req.body)) result[key] = updated[key];
    return res.json(result);
  });

  app.patch('/users/me/available', requireAuth(['regular']), async (req, res) => {
    if (!isObject(req.body) || !onlyFields(req.body, ['available']) || typeof req.body.available !== 'boolean') return badRequest(res);
    if (req.body.available) {
      const regular = await getRegular(req.account.id);
      if (regular.suspended) return badRequest(res);
      const hasQual = await hasApprovedQualification(req.account.id);
      if (!hasQual) return badRequest(res);
    }
    await prisma.regularProfile.update({
      where: { id: req.account.id },
      data: { available: req.body.available, last_active_at: req.now }
    });
    return res.json({ available: req.body.available });
  });

  app.put('/users/me/avatar', requireAuth(['regular']), upload.single('file'), async (req, res) => {
    if (!req.file || !['image/png', 'image/jpeg'].includes(req.file.mimetype)) return badRequest(res);
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const rel = `uploads/users/${req.account.id}/avatar.${ext}`;
    await saveFile(req.file, rel);
    const url = `/${rel}`;
    await prisma.regularProfile.update({ where: { id: req.account.id }, data: { avatar: url } });
    return res.json({ avatar: url });
  });

  app.put('/users/me/resume', requireAuth(['regular']), upload.single('file'), async (req, res) => {
    if (!req.file || req.file.mimetype !== 'application/pdf') return badRequest(res);
    const rel = `uploads/users/${req.account.id}/resume.pdf`;
    await saveFile(req.file, rel);
    const url = `/${rel}`;
    await prisma.regularProfile.update({ where: { id: req.account.id }, data: { resume: url } });
    return res.json({ resume: url });
  });

  app.get('/users/me/invitations', requireAuth(['regular']), async (req, res) => {
    const pag = pagination(req.query);
    if (!pag) return badRequest(res);
    const interests = await prisma.interest.findMany({
      where: { user_id: req.account.id, business_interested: true, candidate_interested: null },
      include: { job: { include: { position_type: true, business: true } } }
    });
    const jobs = interests
      .map((i) => ({ ...i.job, status: effectiveJobStatus(i.job, req.now) }))
      .filter((j) => j.status === 'open')
      .map(mapJobBase);
    return res.json({ count: jobs.length, results: jobs.slice(pag.skip, pag.skip + pag.take) });
  });

  app.get('/users/me/interests', requireAuth(['regular']), async (req, res) => {
    const pag = pagination(req.query);
    if (!pag) return badRequest(res);
    const interests = await prisma.interest.findMany({
      where: { user_id: req.account.id, candidate_interested: true },
      include: { job: { include: { position_type: true, business: true } } }
    });
    const rows = interests.map((i) => ({
      interest_id: i.id,
      mutual: Boolean(i.candidate_interested && i.business_interested),
      job: mapJobBase({ ...i.job, status: effectiveJobStatus(i.job, req.now) })
    }));
    return res.json({ count: rows.length, results: rows.slice(pag.skip, pag.skip + pag.take) });
  });

  app.get('/users/me/jobs', requireAuth(['regular']), async (req, res) => {
    const pag = pagination(req.query);
    if (!pag) return badRequest(res);
    const rows = await prisma.job.findMany({
      where: { worker_id: req.account.id },
      include: { position_type: true, business: true },
      orderBy: { start_time: 'desc' }
    });
    const mapped = rows.map(j => ({
      ...mapJobBase({ ...j, status: effectiveJobStatus(j, req.now) }),
      worker: { id: req.account.id }
    }));
    return res.json({ count: mapped.length, results: mapped.slice(pag.skip, pag.skip + pag.take) });
  });

  app.get('/users/me/qualifications', requireAuth(['regular']), async (req, res) => {
    const pag = pagination(req.query);
    if (!pag) return badRequest(res);
    const where = { user_id: req.account.id };
    const [count, rows] = await Promise.all([
      prisma.qualification.count({ where }),
      prisma.qualification.findMany({
        where,
        include: { position_type: true },
        orderBy: { updatedAt: 'desc' },
        skip: pag.skip,
        take: pag.take
      })
    ]);
    return res.json({
      count,
      results: rows.map(q => ({
        id: q.id,
        status: q.status,
        note: q.note,
        document: q.document,
        position_type: { id: q.position_type.id, name: q.position_type.name },
        updatedAt: q.updatedAt.toISOString()
      }))
    });
  });

  // Admin - user management

  app.get('/users', requireAuth(['admin']), async (req, res) => {
    const pag = pagination(req.query);
    if (!pag) return badRequest(res);
    const activated = req.query.activated !== undefined ? parseBooleanQuery(req.query.activated) : undefined;
    const suspended = req.query.suspended !== undefined ? parseBooleanQuery(req.query.suspended) : undefined;
    if (activated === null || suspended === null) return badRequest(res);
    const where = { account: { role: 'regular' } };
    if (typeof req.query.keyword === 'string') {
      const kw = req.query.keyword;
      where.OR = [
        { first_name: { contains: kw } },
        { last_name: { contains: kw } },
        { phone_number: { contains: kw } },
        { postal_address: { contains: kw } },
        { account: { email: { contains: kw } } }
      ];
    }
    if (activated !== undefined) where.account = { ...where.account, activated };
    if (suspended !== undefined) where.suspended = suspended;
    const [count, rows] = await Promise.all([
      prisma.regularProfile.count({ where }),
      prisma.regularProfile.findMany({ where, include: { account: true }, skip: pag.skip, take: pag.take })
    ]);
    return res.json({ count, results: rows.map(mapRegularPublic) });
  });

  app.patch('/users/:userId(\\d+)/suspended', requireAuth(['admin']), async (req, res) => {
    const userId = parsePositiveInt(req.params.userId);
    if (!userId || !isObject(req.body) || !onlyFields(req.body, ['suspended']) || typeof req.body.suspended !== 'boolean') return badRequest(res);
    const regular = await prisma.regularProfile.findUnique({ where: { id: userId }, include: { account: true } });
    if (!regular) return notFound(res);
    const updated = await prisma.regularProfile.update({ where: { id: userId }, data: { suspended: req.body.suspended } });
    return res.json({
      id: updated.id,
      first_name: updated.first_name,
      last_name: updated.last_name,
      email: regular.account.email,
      activated: regular.account.activated,
      suspended: updated.suspended,
      role: 'regular',
      phone_number: updated.phone_number,
      postal_address: updated.postal_address
    });
  });

  // Position types

  app.post('/position-types', requireAuth(['admin']), async (req, res) => {
    const allowed = ['name', 'description', 'hidden'];
    if (!isObject(req.body) || !onlyFields(req.body, allowed)
      || typeof req.body.name !== 'string' || req.body.name.length === 0
      || typeof req.body.description !== 'string'
      || (req.body.hidden !== undefined && typeof req.body.hidden !== 'boolean')) return badRequest(res);
    const upsertUpdate = {};
    if (req.body.description !== undefined) upsertUpdate.description = req.body.description;
    if (req.body.hidden !== undefined) upsertUpdate.hidden = req.body.hidden;
    const position = await prisma.positionType.upsert({
      where: { name: req.body.name },
      update: upsertUpdate,
      create: { name: req.body.name, description: req.body.description, hidden: req.body.hidden !== undefined ? req.body.hidden : true }
    });
    const qualCount = await prisma.qualification.count({ where: { position_type_id: position.id, status: 'approved' } });
    return res.status(201).json({ id: position.id, name: position.name, description: position.description, hidden: position.hidden, num_qualified: qualCount });
  });

  app.get('/position-types', async (req, res) => {
    const pag = pagination(req.query);
    if (!pag) return badRequest(res);
    let account = null;
    if (req.headers.authorization) {
      account = await tryAuth(req);
      if (!account) return unauthorized(res);
    }
    const admin = account && account.role === 'admin';
    if (!admin && req.query.hidden !== undefined) return badRequest(res);
    if (!admin && req.query.num_qualified !== undefined) return badRequest(res);
    const where = {};
    if (typeof req.query.keyword === 'string') {
      where.OR = [
        { name: { contains: req.query.keyword } },
        { description: { contains: req.query.keyword } }
      ];
    }
    if (!admin) {
      where.hidden = false;
    } else if (req.query.hidden !== undefined) {
      const hidden = parseBooleanQuery(req.query.hidden);
      if (hidden === null) return badRequest(res);
      where.hidden = hidden;
    }
    const rows = await prisma.positionType.findMany({ where });
    const qualCounts = await prisma.qualification.groupBy({
      by: ['position_type_id'],
      where: { status: 'approved' },
      _count: true
    });
    const countMap = new Map(qualCounts.map((x) => [x.position_type_id, x._count]));
    let mapped = rows.map((x) => {
      const obj = { id: x.id, name: x.name, description: x.description };
      if (admin) {
        obj.hidden = x.hidden;
        obj.num_qualified = countMap.get(x.id) || 0;
      }
      return obj;
    });
    if (req.query.name !== undefined) {
      const ord = req.query.name === 'desc' ? 'desc' : req.query.name === 'asc' ? 'asc' : null;
      if (!ord) return badRequest(res);
      mapped.sort((a, b) => ord === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    } else if (req.query.num_qualified !== undefined) {
      if (!admin) return badRequest(res);
      const ord = req.query.num_qualified === 'desc' ? 'desc' : req.query.num_qualified === 'asc' ? 'asc' : null;
      if (!ord) return badRequest(res);
      mapped.sort((a, b) => {
        if (a.num_qualified !== b.num_qualified) return ord === 'asc' ? a.num_qualified - b.num_qualified : b.num_qualified - a.num_qualified;
        return a.name.localeCompare(b.name);
      });
    } else if (admin) {
      mapped.sort((a, b) => {
        if (a.num_qualified !== b.num_qualified) return a.num_qualified - b.num_qualified;
        return a.name.localeCompare(b.name);
      });
    }
    const total = mapped.length;
    return res.json({ count: total, results: mapped.slice(pag.skip, pag.skip + pag.take) });
  });

  app.patch('/position-types/:positionTypeId(\\d+)', requireAuth(['admin']), async (req, res) => {
    const id = parsePositiveInt(req.params.positionTypeId);
    if (!id || !isObject(req.body) || !onlyFields(req.body, ['name', 'description', 'hidden']) || Object.keys(req.body).length === 0) return badRequest(res);
    if ((req.body.name !== undefined && typeof req.body.name !== 'string')
      || (req.body.description !== undefined && typeof req.body.description !== 'string')
      || (req.body.hidden !== undefined && typeof req.body.hidden !== 'boolean')) return badRequest(res);
    const position = await prisma.positionType.findUnique({ where: { id } });
    if (!position) return notFound(res);
    const updated = await prisma.positionType.update({ where: { id }, data: req.body });
    const result = { id };
    if (req.body.name !== undefined) result.name = updated.name;
    if (req.body.description !== undefined) result.description = updated.description;
    if (req.body.hidden !== undefined) result.hidden = updated.hidden;
    return res.json(result);
  });

  app.delete('/position-types/:positionTypeId(\\d+)', requireAuth(['admin']), async (req, res) => {
    const id = parsePositiveInt(req.params.positionTypeId);
    if (!id) return badRequest(res);
    const position = await prisma.positionType.findUnique({ where: { id } });
    if (!position) return notFound(res);
    const count = await prisma.qualification.count({ where: { position_type_id: id, status: 'approved' } });
    if (count > 0) return conflict(res);
    await prisma.positionType.delete({ where: { id } });
    return res.status(204).end();
  });

  // Qualifications

  app.get('/qualifications', requireAuth(['admin']), async (req, res) => {
    const pag = pagination(req.query);
    if (!pag) return badRequest(res);
    const where = { status: { in: ['submitted', 'revised'] } };
    if (typeof req.query.keyword === 'string') {
      const kw = req.query.keyword;
      where.user = {
        OR: [
          { first_name: { contains: kw } },
          { last_name: { contains: kw } },
          { phone_number: { contains: kw } },
          { account: { email: { contains: kw } } }
        ]
      };
    }
    const [count, rows] = await Promise.all([
      prisma.qualification.count({ where }),
      prisma.qualification.findMany({
        where,
        include: { user: true, position_type: true },
        orderBy: { updatedAt: 'desc' },
        skip: pag.skip,
        take: pag.take
      })
    ]);
    return res.json({
      count,
      results: rows.map((q) => ({
        id: q.id,
        status: q.status,
        user: { id: q.user.id, first_name: q.user.first_name, last_name: q.user.last_name },
        position_type: { id: q.position_type.id, name: q.position_type.name },
        updatedAt: q.updatedAt.toISOString()
      }))
    });
  });

  app.post('/qualifications', requireAuth(['regular']), async (req, res) => {
    if (!isObject(req.body) || !onlyFields(req.body, ['position_type_id', 'note'])
      || !Number.isInteger(req.body.position_type_id) || req.body.position_type_id <= 0
      || (req.body.note !== undefined && typeof req.body.note !== 'string')) return badRequest(res);
    const position = await prisma.positionType.findUnique({ where: { id: req.body.position_type_id } });
    if (!position) return notFound(res);
    const existing = await prisma.qualification.findUnique({
      where: { user_id_position_type_id: { user_id: req.account.id, position_type_id: req.body.position_type_id } }
    });
    if (existing) return conflict(res);
    const q = await prisma.qualification.create({
      data: { user_id: req.account.id, position_type_id: req.body.position_type_id, note: req.body.note || '' },
      include: { user: true, position_type: true }
    });
    return res.status(201).json({
      id: q.id,
      status: q.status,
      note: q.note,
      document: q.document,
      user: { id: q.user.id, first_name: q.user.first_name, last_name: q.user.last_name },
      position_type: { id: q.position_type.id, name: q.position_type.name },
      updatedAt: q.updatedAt.toISOString()
    });
  });

  app.get('/qualifications/:qualificationId(\\d+)', requireAuth(['admin', 'regular', 'business']), async (req, res) => {
    const id = parsePositiveInt(req.params.qualificationId);
    if (!id) return notFound(res);
    const q = await prisma.qualification.findUnique({
      where: { id },
      include: { position_type: true, user: { include: { account: true } } }
    });
    if (!q) return notFound(res);
    if (req.account.role === 'regular' && q.user_id !== req.account.id) return notFound(res);
    if (req.account.role === 'business') {
      if (q.status !== 'approved') return forbidden(res);
      const interests = await prisma.interest.findMany({
        where: {
          user_id: q.user_id,
          candidate_interested: true,
          job: { business_id: req.account.id, position_type_id: q.position_type_id }
        },
        include: { job: true }
      });
      const hasActive = interests.some((i) => effectiveJobStatus(i.job, req.now) === 'open');
      if (!hasActive) return forbidden(res);
    }
    const user = {
      id: q.user.id,
      first_name: q.user.first_name,
      last_name: q.user.last_name,
      role: 'regular',
      avatar: q.user.avatar,
      resume: q.user.resume,
      biography: q.user.biography
    };
    if (req.account.role !== 'business') {
      user.email = q.user.account.email;
      user.phone_number = q.user.phone_number;
      user.postal_address = q.user.postal_address;
      user.birthday = q.user.birthday;
      user.activated = q.user.account.activated;
      user.suspended = q.user.suspended;
      user.createdAt = q.user.account.createdAt.toISOString();
    }
    const result = {
      id: q.id,
      document: q.document,
      note: q.note,
      position_type: { id: q.position_type.id, name: q.position_type.name, description: q.position_type.description },
      updatedAt: q.updatedAt.toISOString(),
      user
    };
    if (req.account.role !== 'business') result.status = q.status;
    return res.json(result);
  });

  app.patch('/qualifications/:qualificationId(\\d+)', requireAuth(['admin', 'regular']), async (req, res) => {
    const id = parsePositiveInt(req.params.qualificationId);
    if (!isObject(req.body) || !onlyFields(req.body, ['status', 'note']) || Object.keys(req.body).length === 0) return badRequest(res);
    if (!id) return notFound(res);
    if ((req.body.status !== undefined && typeof req.body.status !== 'string')
      || (req.body.note !== undefined && typeof req.body.note !== 'string')) return badRequest(res);
    const q = await prisma.qualification.findUnique({ where: { id }, include: { user: true, position_type: true } });
    if (!q) return notFound(res);
    if (req.account.role === 'regular' && q.user_id !== req.account.id) return forbidden(res);
    if (req.body.status !== undefined) {
      const status = req.body.status;
      if (req.account.role === 'admin') {
        if (!['approved', 'rejected'].includes(status) || !['submitted', 'revised'].includes(q.status)) return forbidden(res);
      } else {
        const allowed = (q.status === 'created' && status === 'submitted')
          || (['approved', 'rejected'].includes(q.status) && status === 'revised');
        if (!allowed) return forbidden(res);
      }
    }
    const data = {};
    if (req.body.status !== undefined) data.status = req.body.status;
    if (req.body.note !== undefined) data.note = req.body.note;
    const updated = await prisma.qualification.update({
      where: { id },
      data,
      include: { user: true, position_type: true }
    });
    return res.json({
      id: updated.id,
      status: updated.status,
      document: updated.document,
      note: updated.note,
      user: { id: updated.user.id, first_name: updated.user.first_name, last_name: updated.user.last_name },
      position_type: { id: updated.position_type.id, name: updated.position_type.name },
      updatedAt: updated.updatedAt.toISOString()
    });
  });

  app.put('/qualifications/:qualificationId(\\d+)/document', requireAuth(['regular']), upload.single('file'), async (req, res) => {
    const qid = parsePositiveInt(req.params.qualificationId);
    if (!qid || !req.file || req.file.mimetype !== 'application/pdf') return badRequest(res);
    const q = await prisma.qualification.findUnique({ where: { id: qid } });
    if (!q) return notFound(res);
    if (q.user_id !== req.account.id) return forbidden(res);
    const rel = `uploads/users/${req.account.id}/position_type/${q.position_type_id}/document.pdf`;
    await saveFile(req.file, rel);
    const url = `/${rel}`;
    await prisma.qualification.update({ where: { id: qid }, data: { document: url } });
    return res.json({ document: url });
  });

  // System settings endpoints

  app.patch('/system/reset-cooldown', requireAuth(['admin']), async (req, res) => {
    if (!isObject(req.body) || !onlyFields(req.body, ['reset_cooldown'])
      || typeof req.body.reset_cooldown !== 'number' || req.body.reset_cooldown < 0) return badRequest(res);
    config.reset_cooldown = req.body.reset_cooldown;
    return res.json({ reset_cooldown: config.reset_cooldown });
  });

  app.patch('/system/negotiation-window', requireAuth(['admin']), async (req, res) => {
    if (!isObject(req.body) || !onlyFields(req.body, ['negotiation_window'])
      || typeof req.body.negotiation_window !== 'number' || req.body.negotiation_window <= 0) return badRequest(res);
    config.negotiation_window = req.body.negotiation_window;
    return res.json({ negotiation_window: config.negotiation_window });
  });

  app.patch('/system/job-start-window', requireAuth(['admin']), async (req, res) => {
    if (!isObject(req.body) || !onlyFields(req.body, ['job_start_window'])
      || typeof req.body.job_start_window !== 'number' || req.body.job_start_window <= 0) return badRequest(res);
    config.job_start_window = req.body.job_start_window;
    return res.json({ job_start_window: config.job_start_window });
  });

  app.patch('/system/availability-timeout', requireAuth(['admin']), async (req, res) => {
    if (!isObject(req.body) || !onlyFields(req.body, ['availability_timeout'])
      || typeof req.body.availability_timeout !== 'number' || req.body.availability_timeout <= 0) return badRequest(res);
    config.availability_timeout = req.body.availability_timeout;
    return res.json({ availability_timeout: config.availability_timeout });
  });

  // Jobs

  app.get('/jobs', requireAuth(['regular']), async (req, res) => {
    const pag = pagination(req.query);
    if (!pag) return badRequest(res);
    const sort = req.query.sort || 'start_time';
    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    if (!['updatedAt', 'start_time', 'salary_min', 'salary_max', 'distance', 'eta'].includes(sort)) return badRequest(res);
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
    const lon = req.query.lon !== undefined ? Number(req.query.lon) : undefined;
    if ((req.query.lat !== undefined && Number.isNaN(lat)) || (req.query.lon !== undefined && Number.isNaN(lon))) return badRequest(res);
    if ((lat !== undefined) !== (lon !== undefined)) return badRequest(res);
    if ((sort === 'distance' || sort === 'eta') && (lat === undefined || lon === undefined)) return badRequest(res);
    const where = {};
    if (req.query.position_type_id !== undefined) {
      const id = parsePositiveInt(req.query.position_type_id);
      if (!id) return badRequest(res);
      where.position_type_id = id;
    }
    if (req.query.business_id !== undefined) {
      const id = parsePositiveInt(req.query.business_id);
      if (!id) return badRequest(res);
      where.business_id = id;
    }
    const jobs = await prisma.job.findMany({
      where,
      include: { position_type: true, business: true }
    });
    const visible = [];
    for (const j of jobs) {
      const status = effectiveJobStatus(j, req.now);
      if (status !== 'open') continue;
      const ok = await hasApprovedQualificationFor(req.account.id, j.position_type_id);
      if (!ok) continue;
      const row = mapJobBase({ ...j, status });
      if (lat !== undefined && lon !== undefined) {
        const distance = haversineKm(lat, lon, j.business.lat, j.business.lon);
        row.distance = Number(distance.toFixed(1));
        row.eta = Math.round((distance / 30) * 60);
      }
      visible.push(row);
    }
    visible.sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (av < bv) return order === 'asc' ? -1 : 1;
      if (av > bv) return order === 'asc' ? 1 : -1;
      return 0;
    });
    return res.json({ count: visible.length, results: visible.slice(pag.skip, pag.skip + pag.take) });
  });

  app.get('/jobs/:jobId(\\d+)', requireAuth(['regular', 'business']), async (req, res) => {
    const jobId = parsePositiveInt(req.params.jobId);
    if (!jobId) return badRequest(res);
    const hasLat = req.query.lat !== undefined;
    const hasLon = req.query.lon !== undefined;
    if (req.account.role === 'business' && (hasLat || hasLon)) return badRequest(res);
    if (hasLat !== hasLon) return badRequest(res);
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { position_type: true, business: true, worker: true }
    });
    if (!job) return notFound(res);
    const status = effectiveJobStatus(job, req.now);
    if (req.account.role === 'business') {
      if (job.business_id !== req.account.id) return notFound(res);
    } else {
      const qualifies = await hasApprovedQualificationFor(req.account.id, job.position_type_id);
      if (!qualifies) return forbidden(res);
      const accessible = status === 'open' || job.worker_id === req.account.id;
      if (!accessible) return forbidden(res);
    }
    const out = mapJobDetail({ ...job, status });
    if (req.account.role === 'regular' && req.query.lat !== undefined && req.query.lon !== undefined) {
      const qlat = Number(req.query.lat);
      const qlon = Number(req.query.lon);
      if (Number.isNaN(qlat) || Number.isNaN(qlon)) return badRequest(res);
      const dist = haversineKm(qlat, qlon, job.business.lat, job.business.lon);
      out.distance = Number(dist.toFixed(1));
      out.eta = Math.round((dist / 30) * 60);
    }
    return res.json(out);
  });

  app.patch('/jobs/:jobId(\\d+)/no-show', requireAuth(['business']), async (req, res) => {
    const jobId = parsePositiveInt(req.params.jobId);
    if (!jobId) return badRequest(res);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return notFound(res);
    if (job.business_id !== req.account.id) return forbidden(res);
    if (job.status !== 'filled' || req.now < job.start_time || req.now >= job.end_time) return conflict(res);
    const updated = await prisma.$transaction(async (tx) => {
      const j = await tx.job.update({ where: { id: jobId }, data: { status: 'canceled' } });
      if (j.worker_id) {
        await tx.regularProfile.update({ where: { id: j.worker_id }, data: { suspended: true } });
      }
      return j;
    });
    return res.json({ id: updated.id, status: 'cancelled', updatedAt: updated.updatedAt.toISOString() });
  });

  app.patch('/jobs/:jobId(\\d+)/interested', requireAuth(['regular']), async (req, res) => {
    const jobId = parsePositiveInt(req.params.jobId);
    if (!jobId || !isObject(req.body) || !onlyFields(req.body, ['interested']) || typeof req.body.interested !== 'boolean') return badRequest(res);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return notFound(res);
    const status = effectiveJobStatus(job, req.now);
    if (status !== 'open') return conflict(res);
    const qualifies = await hasApprovedQualificationFor(req.account.id, job.position_type_id);
    if (!qualifies) return forbidden(res);
    const active = await currentActiveNegotiationForUser(req.account.id, req.now);
    if (active && active.interest.job_id === jobId) return conflict(res);
    let interest = await prisma.interest.findUnique({ where: { job_id_user_id: { job_id: jobId, user_id: req.account.id } } });
    if (!req.body.interested) {
      if (!interest || !interest.candidate_interested) return badRequest(res);
      interest = await prisma.interest.update({
        where: { id: interest.id },
        data: { candidate_interested: null }
      });
    } else {
      if (!interest) {
        interest = await prisma.interest.create({
          data: { job_id: jobId, user_id: req.account.id, candidate_interested: true, business_interested: null }
        });
      } else {
        interest = await prisma.interest.update({
          where: { id: interest.id },
          data: { candidate_interested: true }
        });
      }
    }
    await prisma.regularProfile.update({ where: { id: req.account.id }, data: { available: true, last_active_at: req.now } });
    const candidateInterested = req.body.interested ? interest.candidate_interested : false;
    return res.json({
      id: interest.id,
      job_id: interest.job_id,
      candidate: { id: req.account.id, interested: candidateInterested },
      business: { id: job.business_id, interested: interest.business_interested }
    });
  });

  app.get('/jobs/:jobId(\\d+)/candidates', requireAuth(['business']), async (req, res) => {
    const jobId = parsePositiveInt(req.params.jobId);
    const pag = pagination(req.query);
    if (!jobId || !pag) return badRequest(res);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.business_id !== req.account.id) return notFound(res);
    const users = await prisma.regularProfile.findMany({ include: { account: true } });
    const results = [];
    for (const user of users) {
      if (!(await isDiscoverable(user.id, job, req.now))) continue;
      const interest = await prisma.interest.findUnique({ where: { job_id_user_id: { job_id: jobId, user_id: user.id } } });
      results.push({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        invited: Boolean(interest && interest.business_interested)
      });
    }
    return res.json({ count: results.length, results: results.slice(pag.skip, pag.skip + pag.take) });
  });

  app.get('/jobs/:jobId(\\d+)/candidates/:userId(\\d+)', requireAuth(['business']), async (req, res) => {
    const jobId = parsePositiveInt(req.params.jobId);
    const userId = parsePositiveInt(req.params.userId);
    if (!jobId || !userId) return badRequest(res);
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { position_type: true } });
    if (!job || job.business_id !== req.account.id) return notFound(res);
    const user = await prisma.regularProfile.findUnique({ where: { id: userId }, include: { account: true } });
    if (!user) return notFound(res);
    const status = effectiveJobStatus(job, req.now);
    const isFilled = job.status === 'filled' && job.worker_id === userId && job.end_time > req.now;
    if (!isFilled) {
      const discoverable = await isDiscoverable(userId, job, req.now);
      if (!discoverable) return forbidden(res);
    }
    const q = await prisma.qualification.findUnique({
      where: { user_id_position_type_id: { user_id: userId, position_type_id: job.position_type_id } }
    });
    const userOut = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar,
      resume: user.resume,
      biography: user.biography,
      qualification: q ? { id: q.id, position_type_id: q.position_type_id, document: q.document, note: q.note, updatedAt: q.updatedAt.toISOString() } : null
    };
    if (isFilled) {
      userOut.email = user.account.email;
      userOut.phone_number = user.phone_number;
    }
    return res.json({
      user: userOut,
      job: {
        id: job.id,
        status,
        position_type: { id: job.position_type.id, name: job.position_type.name, description: job.position_type.description },
        start_time: job.start_time.toISOString(),
        end_time: job.end_time.toISOString()
      }
    });
  });

  app.patch('/jobs/:jobId(\\d+)/candidates/:userId(\\d+)/interested', requireAuth(['business']), async (req, res) => {
    const jobId = parsePositiveInt(req.params.jobId);
    const userId = parsePositiveInt(req.params.userId);
    if (!jobId || !userId || !isObject(req.body) || !onlyFields(req.body, ['interested']) || typeof req.body.interested !== 'boolean') return badRequest(res);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.business_id !== req.account.id) return notFound(res);
    const status = effectiveJobStatus(job, req.now);
    if (status !== 'open') return conflict(res);
    const user = await prisma.regularProfile.findUnique({ where: { id: userId } });
    if (!user) return notFound(res);
    const discoverable = await isDiscoverable(userId, job, req.now);
    if (!discoverable) return forbidden(res);
    let interest = await prisma.interest.findUnique({ where: { job_id_user_id: { job_id: jobId, user_id: userId } } });
    if (!req.body.interested) {
      if (!interest || !interest.business_interested) return badRequest(res);
      interest = await prisma.interest.update({
        where: { id: interest.id },
        data: { business_interested: null }
      });
    } else {
      if (!interest) {
        interest = await prisma.interest.create({
          data: { job_id: jobId, user_id: userId, business_interested: true, candidate_interested: null }
        });
      } else {
        interest = await prisma.interest.update({
          where: { id: interest.id },
          data: { business_interested: true }
        });
      }
    }
    const businessInterested = req.body.interested ? interest.business_interested : false;
    return res.json({
      id: interest.id,
      job_id: jobId,
      candidate: { id: userId, interested: interest.candidate_interested },
      business: { id: req.account.id, interested: businessInterested }
    });
  });

  app.get('/jobs/:jobId(\\d+)/interests', requireAuth(['business']), async (req, res) => {
    const jobId = parsePositiveInt(req.params.jobId);
    const pag = pagination(req.query);
    if (!jobId || !pag) return badRequest(res);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.business_id !== req.account.id) return notFound(res);
    const interests = await prisma.interest.findMany({
      where: { job_id: jobId, candidate_interested: true },
      include: { user: true }
    });
    const rows = interests.map((i) => ({
      interest_id: i.id,
      mutual: Boolean(i.candidate_interested && i.business_interested),
      user: { id: i.user.id, first_name: i.user.first_name, last_name: i.user.last_name }
    }));
    return res.json({ count: rows.length, results: rows.slice(pag.skip, pag.skip + pag.take) });
  });

  // Negotiations

  app.post('/negotiations', requireAuth(['regular', 'business']), async (req, res) => {
    if (!isObject(req.body) || !onlyFields(req.body, ['interest_id']) || !Number.isInteger(req.body.interest_id) || req.body.interest_id <= 0) return badRequest(res);
    const interest = await prisma.interest.findUnique({
      where: { id: req.body.interest_id },
      include: { job: { include: { position_type: true, business: true } }, user: true }
    });
    if (!interest) return notFound(res);
    const owns = req.account.role === 'regular' ? interest.user_id === req.account.id : interest.job.business_id === req.account.id;
    if (!owns) return notFound(res);
    const existing = await prisma.negotiation.findFirst({
      where: { interest_id: interest.id, status: 'active' }
    });
    if (existing) {
      if (existing.expiresAt > req.now) {
        return res.status(200).json({
          id: existing.id,
          status: existing.status,
          createdAt: existing.createdAt.toISOString(),
          updatedAt: existing.updatedAt.toISOString(),
          expiresAt: existing.expiresAt.toISOString(),
          job: mapJobForNegotiation({ ...interest.job, status: effectiveJobStatus(interest.job, req.now) }),
          user: { id: interest.user.id, first_name: interest.user.first_name, last_name: interest.user.last_name },
          decisions: { candidate: existing.candidate_decision, business: existing.business_decision }
        });
      }
      await refreshNegotiationIfExpired(existing, req.now);
    }
    if (!(interest.candidate_interested && interest.business_interested)) return forbidden(res);
    const jobStatus = effectiveJobStatus(interest.job, req.now);
    if (jobStatus !== 'open') return conflict(res);
    const activeUserNeg = await currentActiveNegotiationForUser(interest.user_id, req.now);
    if (activeUserNeg) return conflict(res);
    const activeBusinessNeg = await currentActiveNegotiationForBusiness(interest.job.business_id, req.now);
    if (activeBusinessNeg) return conflict(res);
    if (!(await isDiscoverable(interest.user_id, interest.job, req.now))) return forbidden(res);
    const created = await prisma.$transaction(async (tx) => {
      const activeJob = await tx.negotiation.findFirst({
        where: { status: 'active', interest: { job_id: interest.job_id }, expiresAt: { gt: req.now } }
      });
      if (activeJob) return { error: 'job' };
      const activeUser = await tx.negotiation.findFirst({
        where: { status: 'active', interest: { user_id: interest.user_id }, expiresAt: { gt: req.now } }
      });
      if (activeUser) return { error: 'party' };
      const activeBusiness = await tx.negotiation.findFirst({
        where: { status: 'active', interest: { job: { business_id: interest.job.business_id } }, expiresAt: { gt: req.now } }
      });
      if (activeBusiness) return { error: 'party' };
      const n = await tx.negotiation.create({
        data: { interest_id: interest.id, status: 'active', expiresAt: new Date(req.now.getTime() + config.negotiation_window * 1000) }
      });
      await tx.regularProfile.update({ where: { id: interest.user_id }, data: { available: false } });
      return n;
    });
    if (created.error) return conflict(res);
    await joinNegotiationRooms(created.id, interest.user_id, interest.job.business_id);
    emitNegotiationStarted(created.id, interest.user_id, interest.job.business_id);
    return res.status(201).json({
      id: created.id,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      expiresAt: created.expiresAt.toISOString(),
      job: mapJobForNegotiation({ ...interest.job, status: effectiveJobStatus(interest.job, req.now) }),
      user: { id: interest.user.id, first_name: interest.user.first_name, last_name: interest.user.last_name },
      decisions: { candidate: null, business: null }
    });
  });

  app.get('/negotiations/me', requireAuth(['regular', 'business']), async (req, res) => {
    const neg = req.account.role === 'regular'
      ? await currentActiveNegotiationForUser(req.account.id, req.now)
      : await currentActiveNegotiationForBusiness(req.account.id, req.now);
    const refreshed = await refreshNegotiationIfExpired(neg ? neg : null, req.now);
    if (!refreshed || refreshed.status !== 'active') return notFound(res);
    const full = await prisma.negotiation.findUnique({
      where: { id: refreshed.id },
      include: { interest: { include: { job: { include: { position_type: true, business: true } }, user: true } } }
    });
    if (!full || full.status !== 'active') return notFound(res);
    const job = full.interest.job;
    return res.json({
      id: full.id,
      status: full.status,
      createdAt: full.createdAt.toISOString(),
      expiresAt: full.expiresAt.toISOString(),
      updatedAt: full.updatedAt.toISOString(),
      job: mapJobBase({ ...job, status: effectiveJobStatus(job, req.now) }),
      user: { id: full.interest.user.id, first_name: full.interest.user.first_name, last_name: full.interest.user.last_name },
      decisions: { candidate: full.candidate_decision, business: full.business_decision }
    });
  });

  app.patch('/negotiations/me/decision', requireAuth(['regular', 'business']), async (req, res) => {
    if (!isObject(req.body) || !onlyFields(req.body, ['decision', 'negotiation_id'])
      || !['accept', 'decline'].includes(req.body.decision)
      || !Number.isInteger(req.body.negotiation_id) || req.body.negotiation_id <= 0) return badRequest(res);
    const requested = await prisma.negotiation.findUnique({ where: { id: req.body.negotiation_id } });
    if (!requested) return notFound(res);
    const active = req.account.role === 'regular'
      ? await currentActiveNegotiationForUser(req.account.id, req.now)
      : await currentActiveNegotiationForBusiness(req.account.id, req.now);
    const refreshed = await refreshNegotiationIfExpired(active, req.now);
    if (!refreshed || refreshed.status !== 'active') return notFound(res);
    if (refreshed.id !== req.body.negotiation_id) return conflict(res);
    const full = await prisma.negotiation.findUnique({
      where: { id: refreshed.id },
      include: { interest: { include: { job: true } } }
    });
    const data = req.account.role === 'regular'
      ? { candidate_decision: req.body.decision }
      : { business_decision: req.body.decision };
    await prisma.negotiation.update({ where: { id: full.id }, data });
    const after = await prisma.negotiation.findUnique({ where: { id: full.id } });
    let finalNeg = after;
    if (after.candidate_decision === 'decline' || after.business_decision === 'decline') {
      await prisma.$transaction(async (tx) => {
        await tx.negotiation.update({ where: { id: after.id }, data: { status: 'failed' } });
        await tx.interest.update({ where: { id: full.interest_id }, data: { candidate_interested: null, business_interested: null } });
        await tx.regularProfile.update({ where: { id: full.interest.user_id }, data: { available: true, last_active_at: req.now } });
      });
      finalNeg = await prisma.negotiation.findUnique({ where: { id: after.id } });
    } else if (after.candidate_decision === 'accept' && after.business_decision === 'accept') {
      await prisma.$transaction(async (tx) => {
        await tx.negotiation.update({ where: { id: after.id }, data: { status: 'success' } });
        await tx.job.update({ where: { id: full.interest.job_id }, data: { status: 'filled', worker_id: full.interest.user_id } });
        await tx.regularProfile.update({ where: { id: full.interest.user_id }, data: { available: true, last_active_at: req.now } });
      });
      finalNeg = await prisma.negotiation.findUnique({ where: { id: after.id } });
    }
    return res.json({
      id: finalNeg.id,
      status: finalNeg.status,
      createdAt: finalNeg.createdAt.toISOString(),
      expiresAt: finalNeg.expiresAt.toISOString(),
      updatedAt: finalNeg.updatedAt.toISOString(),
      decisions: { candidate: finalNeg.candidate_decision, business: finalNeg.business_decision }
    });
  });

  // Method check + catch-all 404/500

  const allowedMethods = [
    ['^/users$', ['POST', 'GET']],
    ['^/users/me$', ['GET', 'PATCH']],
    ['^/users/me/available$', ['PATCH']],
    ['^/users/me/avatar$', ['PUT']],
    ['^/users/me/resume$', ['PUT']],
    ['^/users/me/invitations$', ['GET']],
    ['^/users/me/interests$', ['GET']],
    ['^/users/me/qualifications$', ['GET']],
    ['^/users/me/jobs$', ['GET']],
    ['^/users/\\d+/suspended$', ['PATCH']],
    ['^/businesses$', ['POST', 'GET']],
    ['^/businesses/me$', ['GET', 'PATCH']],
    ['^/businesses/me/avatar$', ['PUT']],
    ['^/businesses/me/jobs$', ['POST', 'GET']],
    ['^/businesses/me/jobs/\\d+$', ['PATCH', 'DELETE']],
    ['^/businesses/\\d+$', ['GET']],
    ['^/businesses/\\d+/verified$', ['PATCH']],
    ['^/auth/resets$', ['POST']],
    ['^/auth/resets/[^/]+$', ['POST']],
    ['^/auth/tokens$', ['POST']],
    ['^/position-types$', ['POST', 'GET']],
    ['^/position-types/\\d+$', ['PATCH', 'DELETE']],
    ['^/qualifications$', ['GET', 'POST']],
    ['^/qualifications/\\d+$', ['GET', 'PATCH']],
    ['^/qualifications/\\d+/document$', ['PUT']],
    ['^/system/reset-cooldown$', ['PATCH']],
    ['^/system/negotiation-window$', ['PATCH']],
    ['^/system/job-start-window$', ['PATCH']],
    ['^/system/availability-timeout$', ['PATCH']],
    ['^/jobs$', ['GET']],
    ['^/jobs/\\d+$', ['GET']],
    ['^/jobs/\\d+/no-show$', ['PATCH']],
    ['^/jobs/\\d+/interested$', ['PATCH']],
    ['^/jobs/\\d+/candidates$', ['GET']],
    ['^/jobs/\\d+/candidates/\\d+$', ['GET']],
    ['^/jobs/\\d+/candidates/\\d+/interested$', ['PATCH']],
    ['^/jobs/\\d+/interests$', ['GET']],
    ['^/negotiations$', ['POST']],
    ['^/negotiations/me$', ['GET']],
    ['^/negotiations/me/decision$', ['PATCH']]
  ];

  app.use((req, res, next) => {
    for (const [pattern, methods] of allowedMethods) {
      if (new RegExp(pattern).test(req.path)) {
        if (!methods.includes(req.method)) return res.status(405).json({ error: 'Method Not Allowed' });
        break;
      }
    }
    next();
  });

  app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) return res.status(400).json({ error: 'Bad Request' });
    return res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

module.exports = { create_app };
