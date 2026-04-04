'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123123', 10);

  // ---- Clean existing data ----
  await prisma.negotiation.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.job.deleteMany();
  await prisma.qualification.deleteMany();
  await prisma.positionType.deleteMany();
  await prisma.regularProfile.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.account.deleteMany();

  // ---- Position types (10+) ----
  const positionTypes = await Promise.all([
    prisma.positionType.create({ data: { name: 'Dental Hygienist', description: 'Cleans teeth, examines patients for signs of oral diseases.', hidden: false } }),
    prisma.positionType.create({ data: { name: 'Dental Assistant (Level 1)', description: 'Assists dentists during procedures, prepares instruments.', hidden: false } }),
    prisma.positionType.create({ data: { name: 'Dental Assistant (Level 2)', description: 'Performs expanded functions including coronal polishing.', hidden: false } }),
    prisma.positionType.create({ data: { name: 'Registered Dental Technologist', description: 'Creates dental prosthetics and appliances in a lab setting.', hidden: false } }),
    prisma.positionType.create({ data: { name: 'Orthodontist', description: 'Specializes in correcting misaligned teeth and jaws.', hidden: false } }),
    prisma.positionType.create({ data: { name: 'Oral Surgeon', description: 'Performs surgical procedures on the mouth and jaw.', hidden: false } }),
    prisma.positionType.create({ data: { name: 'Endodontist', description: 'Specializes in root canal treatments.', hidden: false } }),
    prisma.positionType.create({ data: { name: 'Periodontal Therapist', description: 'Treats gum disease and performs scaling procedures.', hidden: false } }),
    prisma.positionType.create({ data: { name: 'Dental Receptionist', description: 'Front desk management, scheduling, and patient coordination.', hidden: false } }),
    prisma.positionType.create({ data: { name: 'Dental Sterilization Technician', description: 'Maintains and sterilizes dental instruments and equipment.', hidden: false } }),
    prisma.positionType.create({ data: { name: 'Prosthodontist', description: 'Specializes in restoring and replacing missing or damaged teeth.', hidden: true } }),
    prisma.positionType.create({ data: { name: 'Pediatric Dental Nurse', description: 'Provides dental care specifically for children.', hidden: false } }),
  ]);

  const ptHygienist = positionTypes[0];
  const ptDA1 = positionTypes[1];
  const ptDA2 = positionTypes[2];
  const ptRDT = positionTypes[3];
  const ptOrtho = positionTypes[4];
  const ptSurgeon = positionTypes[5];
  const ptEndo = positionTypes[6];
  const ptPerio = positionTypes[7];
  const ptReception = positionTypes[8];
  const ptSteri = positionTypes[9];

  // ---- Admin accounts ----
  const admin1 = await prisma.account.create({
    data: {
      email: 'admin1@csc309.utoronto.ca',
      password_hash: passwordHash,
      role: 'admin',
      activated: true,
      admin: { create: {} }
    }
  });

  // ---- Business accounts (10+) ----
  const businessData = [
    { name: 'Davenport Dental Clinic', owner: 'Dr. Mohan Patel', email: 'business1@csc309.utoronto.ca', phone: '416-978-2011', address: '40 St George St, Toronto, ON M5S 2E4', lat: 43.6598, lon: -79.3999 },
    { name: 'Yonge Dental Care', owner: 'Dr. Sarah Kapoor', email: 'business2@csc309.utoronto.ca', phone: '416-977-3344', address: '263 Spadina Ave, Toronto, ON M5T 2E3', lat: 43.6481, lon: -79.3962 },
    { name: 'Simcoe Dental Centre', owner: 'Dr. Robert Sun', email: 'business3@csc309.utoronto.ca', phone: '416-363-8700', address: '1 First Canadian Place, Toronto, ON', lat: 43.6481, lon: -79.3802 },
    { name: 'Halton Dental Centre', owner: 'Dr. Shreya Johnson', email: 'business4@csc309.utoronto.ca', phone: '416-922-1100', address: '550 Bloor St W, Toronto, ON M5S 1Y9', lat: 43.6657, lon: -79.4124 },
    { name: 'Howard Dental Care', owner: 'Dr. John Allen', email: 'business5@csc309.utoronto.ca', phone: '416-979-6000', address: '192 Baldwin St, Toronto, ON M5T 3K5', lat: 43.6544, lon: -79.4012 },
    { name: 'Argyl Dental Clinic', owner: 'Dr. Emma Smith', email: 'business6@csc309.utoronto.ca', phone: '416-463-7777', address: '1249 Danforth Ave, Toronto, ON M4J 1M3', lat: 43.6846, lon: -79.3286 },
    { name: 'York Dental Health', owner: 'Dr. Sam Samuel', email: 'business7@csc309.utoronto.ca', phone: '416-736-5000', address: '4700 Keele St, North York, ON M3J 1P3', lat: 43.7735, lon: -79.5019 },
    { name: 'IR Dental Centre', owner: 'Dr. Boris Kirsten', email: 'business8@csc309.utoronto.ca', phone: '416-482-2626', address: '2379 Yonge St, Toronto, ON M4P 2C7', lat: 43.7115, lon: -79.3973 },
    { name: 'Village Dental Care', owner: 'Dr. Lalit Patel', email: 'business9@csc309.utoronto.ca', phone: '416-534-9182', address: '171 East Liberty St, Toronto, ON M6K 3P6', lat: 43.6375, lon: -79.4213 },
    { name: 'Eglington Dental Health', owner: 'Dr. Tim Kapoor', email: 'business10@csc309.utoronto.ca', phone: '416-291-4320', address: '2900 Warden Ave, Scarborough, ON M1W 2S8', lat: 43.7960, lon: -79.2884 },
    { name: 'Avenue Dental Clinic', owner: 'Dr. Xian Sun', email: 'business11@csc309.utoronto.ca', phone: '416-203-3333', address: '247 Queens Quay W, Toronto, ON M5J 2N3', lat: 43.6387, lon: -79.3840 },
    { name: 'Wellessley Dental Centre', owner: 'Dr. Mark Johnson', email: 'business12@csc309.utoronto.ca', phone: '416-222-1234', address: '4841 Yonge St, North York, ON M2N 5X2', lat: 43.7610, lon: -79.4120 },
  ];

  const businesses = [];
  for (const b of businessData) {
    const acc = await prisma.account.create({
      data: {
        email: b.email,
        password_hash: passwordHash,
        role: 'business',
        activated: true,
        business: {
          create: {
            business_name: b.name,
            owner_name: b.owner,
            phone_number: b.phone,
            postal_address: b.address,
            lat: b.lat,
            lon: b.lon,
            verified: true,
            biography: `${b.name} is a modern dental clinic committed to providing exceptional patient care in the heart of Toronto.`
          }
        }
      },
      include: { business: true }
    });
    businesses.push(acc.business);
  }

  // Make business11 and business12 unverified (for admin to verify)
  await prisma.businessProfile.update({ where: { id: businesses[10].id }, data: { verified: false } });
  await prisma.businessProfile.update({ where: { id: businesses[11].id }, data: { verified: false } });

  // ---- Regular user accounts (20+) ----
  const userData = [
    { first: 'Sarah', last: 'Allen', email: 'regular1@csc309.utoronto.ca', phone: '416-555-3921', address: '123 College St, Toronto, ON M5T 1R5', bio: 'Experienced dental hygienist with 5 years in private practice.' },
    { first: 'John', last: 'Konstas', email: 'regular2@csc309.utoronto.ca', phone: '416-555-9900', address: '154 Dupont St, Toronto, ON M5R 1V2', bio: 'Level 2 dental assistant looking for flexible shifts.' },
    { first: 'Shreya', last: 'Patel', email: 'regular3@csc309.utoronto.ca', phone: '416-555-1234', address: '45 Queen St W, Toronto, ON M5H 2M4', bio: 'Recent dental hygiene graduate eager for opportunities.' },
    { first: 'Mohan', last: 'Kapoor', email: 'regular4@csc309.utoronto.ca', phone: '416-555-5678', address: '67 Dundas St E, Toronto, ON M5B 2B3', bio: 'Certified dental technologist with lab experience.' },
    { first: 'Emma', last: 'Sun', email: 'regular5@csc309.utoronto.ca', phone: '416-555-8765', address: '200 King St W, Toronto, ON M5H 3T4', bio: 'Friendly dental receptionist with excellent patient care skills.' },
    { first: 'Sam', last: 'Johnson', email: 'regular6@csc309.utoronto.ca', phone: '416-555-4321', address: '789 Bathurst St, Toronto, ON M5R 2R5', bio: 'Dental assistant with experience in pediatric dentistry.' },
    { first: 'Kevin', last: 'Peterson', email: 'regular7@csc309.utoronto.ca', phone: '416-555-7890', address: '101 Bloor St E, Toronto, ON M4W 3R2', bio: 'Periodontal therapist specializing in gum disease treatment.' },
    { first: 'Tim', last: 'Samuel', email: 'regular8@csc309.utoronto.ca', phone: '416-555-2345', address: '55 Front St W, Toronto, ON M5J 1E6', bio: 'Orthodontic assistant with 3 years of experience.' },
    { first: 'Xian', last: 'Lara', email: 'regular9@csc309.utoronto.ca', phone: '416-555-6789', address: '300 Yonge St, Toronto, ON M5B 1C4', bio: 'Sterilization technician available for weekends.' },
    { first: 'Robert', last: 'Kirsten', email: 'regular10@csc309.utoronto.ca', phone: '416-555-3456', address: '150 Eglinton Ave E, Toronto, ON M4P 1E8', bio: 'Experienced dental hygienist seeking part-time work.' },
    { first: 'Shane', last: 'Allen', email: 'regular11@csc309.utoronto.ca', phone: '416-555-9012', address: '88 Adelaide St W, Toronto, ON M5H 1S3', bio: 'Level 1 dental assistant, quick learner.' },
    { first: 'Mitchell', last: 'Lee', email: 'regular12@csc309.utoronto.ca', phone: '416-555-3478', address: '22 St Clair Ave E, Toronto, ON M4T 2S3', bio: 'Dental technologist with specialization in ceramic restorations.' },
    { first: 'Mark', last: 'Johnson', email: 'regular13@csc309.utoronto.ca', phone: '416-555-2109', address: '400 Danforth Ave, Toronto, ON M4K 1N8', bio: 'Dental hygienist passionate about preventive care.' },
    { first: 'Rohan', last: 'Kapoor', email: 'regular14@csc309.utoronto.ca', phone: '416-555-6543', address: '75 Gerrard St W, Toronto, ON M5G 1Z6', bio: 'Endodontic assistant with 2 years of experience.' },
    { first: 'Ali', last: 'Khan', email: 'regular15@csc309.utoronto.ca', phone: '416-555-0987', address: '233 King St E, Toronto, ON M5A 1J8', bio: 'Dental receptionist and scheduling specialist.' },
    { first: 'Steven', last: 'Smith', email: 'regular16@csc309.utoronto.ca', phone: '416-555-4567', address: '18 Spadina Ave, Toronto, ON M5V 2H5', bio: 'Oral surgery assistant with hospital experience.' },
    { first: 'Finn', last: 'Samuel', email: 'regular17@csc309.utoronto.ca', phone: '416-555-7654', address: '95 Liberty St, Toronto, ON M6K 3L7', bio: 'Pediatric dental nurse with a caring approach.' },
    { first: 'Sarah', last: 'Lara', email: 'regular18@csc309.utoronto.ca', phone: '416-555-3210', address: '567 Queen St W, Toronto, ON M5V 2B5', bio: 'Experienced DA2 available for immediate placement.' },
    { first: 'John', last: 'Kirsten', email: 'regular19@csc309.utoronto.ca', phone: '416-555-9876', address: '789 College St, Toronto, ON M6G 1C6', bio: 'Dental hygienist with certificate in periodontics.' },
    { first: 'Emma', last: 'Allen', email: 'regular20@csc309.utoronto.ca', phone: '416-555-5432', address: '12 Harbord St, Toronto, ON M5S 1G4', bio: 'Registered dental technologist, 8 years of experience.' },
    { first: 'Xian', last: 'Sun', email: 'regular21@csc309.utoronto.ca', phone: '416-555-1098', address: '45 McCaul St, Toronto, ON M5T 1V7', bio: 'Dedicated sterilization tech with attention to protocol.' },
    { first: 'Sam', last: 'Konstas', email: 'regular22@csc309.utoronto.ca', phone: '416-555-8901', address: '330 University Ave, Toronto, ON M5G 1R8', bio: 'Orthodontic assistant seeking part-time opportunities.' },
  ];

  const users = [];
  for (const u of userData) {
    const acc = await prisma.account.create({
      data: {
        email: u.email,
        password_hash: passwordHash,
        role: 'regular',
        activated: true,
        regular: {
          create: {
            first_name: u.first,
            last_name: u.last,
            phone_number: u.phone,
            postal_address: u.address,
            biography: u.bio,
            birthday: '1990-01-01',
            available: true,
            last_active_at: new Date()
          }
        }
      },
      include: { regular: true }
    });
    users.push(acc.regular);
  }

  // Suspend user 21
  await prisma.regularProfile.update({ where: { id: users[20].id }, data: { suspended: true } });

  // ---- Qualifications ----
  const qualData = [
    { userId: users[0].id, ptId: ptHygienist.id, status: 'approved', note: 'Licensed dental hygienist, 5 years experience.' },
    { userId: users[0].id, ptId: ptPerio.id, status: 'submitted', note: 'Periodontics certificate from TMU.' },
    { userId: users[1].id, ptId: ptDA2.id, status: 'approved', note: 'Certified DA Level 2 with 3 years at private clinic.' },
    { userId: users[1].id, ptId: ptDA1.id, status: 'approved', note: 'Level 1 certification included.' },
    { userId: users[2].id, ptId: ptHygienist.id, status: 'submitted', note: 'Recent grad from George Brown College.' },
    { userId: users[2].id, ptId: ptDA1.id, status: 'approved', note: 'Level 1 assistant certification.' },
    { userId: users[3].id, ptId: ptRDT.id, status: 'approved', note: 'RDT with specialization in ceramics.' },
    { userId: users[4].id, ptId: ptReception.id, status: 'approved', note: 'Front desk experience at 3 dental clinics.' },
    { userId: users[4].id, ptId: ptSteri.id, status: 'rejected', note: 'Need more documentation.' },
    { userId: users[5].id, ptId: ptDA1.id, status: 'approved', note: 'Pediatric dental focus, great with kids.' },
    { userId: users[6].id, ptId: ptPerio.id, status: 'approved', note: 'Registered periodontal therapist.' },
    { userId: users[6].id, ptId: ptHygienist.id, status: 'approved', note: 'Also a licensed hygienist.' },
    { userId: users[7].id, ptId: ptOrtho.id, status: 'submitted', note: 'Orthodontic assisting certificate.' },
    { userId: users[7].id, ptId: ptDA1.id, status: 'approved', note: 'Base DA1 certification.' },
    { userId: users[8].id, ptId: ptSteri.id, status: 'approved', note: 'IPAC certified sterilization technician.' },
    { userId: users[9].id, ptId: ptHygienist.id, status: 'approved', note: 'Part-time hygienist, excellent patient rapport.' },
    { userId: users[10].id, ptId: ptDA1.id, status: 'revised', note: 'Updated with new certificate scans.' },
    { userId: users[11].id, ptId: ptRDT.id, status: 'approved', note: 'Specialist in ceramic restorations, 8 years exp.' },
    { userId: users[12].id, ptId: ptHygienist.id, status: 'approved', note: 'Focus on preventive care and patient education.' },
    { userId: users[13].id, ptId: ptEndo.id, status: 'submitted', note: 'Two years as endodontic assistant.' },
    { userId: users[13].id, ptId: ptDA1.id, status: 'approved', note: 'Level 1 included.' },
    { userId: users[14].id, ptId: ptReception.id, status: 'approved', note: 'Dental office admin specialist.' },
    { userId: users[15].id, ptId: ptSurgeon.id, status: 'submitted', note: 'Oral surgery experience at Toronto General.' },
    { userId: users[16].id, ptId: positionTypes[11].id, status: 'approved', note: 'Pediatric dental nurse with 4 years experience.' },
    { userId: users[17].id, ptId: ptDA2.id, status: 'approved', note: 'DA Level 2 available for immediate start.' },
    { userId: users[17].id, ptId: ptDA1.id, status: 'approved', note: 'Level 1 included.' },
    { userId: users[18].id, ptId: ptHygienist.id, status: 'approved', note: 'Periodontics specialty hygienist.' },
    { userId: users[18].id, ptId: ptPerio.id, status: 'approved', note: 'Certificate in periodontal therapy.' },
    { userId: users[19].id, ptId: ptRDT.id, status: 'approved', note: '8 years as registered dental technologist.' },
    { userId: users[20].id, ptId: ptSteri.id, status: 'approved', note: 'Steri tech, IPAC certified.' },
    { userId: users[21].id, ptId: ptOrtho.id, status: 'created', note: '' },
    { userId: users[3].id, ptId: ptHygienist.id, status: 'submitted', note: 'Completed hygiene course at George Brown College.' },
    { userId: users[5].id, ptId: ptHygienist.id, status: 'submitted', note: 'Hygienist certification in progress.' },
    { userId: users[11].id, ptId: ptHygienist.id, status: 'submitted', note: 'Dual-certified technologist and hygienist.' },
    { userId: users[14].id, ptId: ptSteri.id, status: 'revised', note: 'Resubmitting with updated IPAC certificate.' },
    { userId: users[19].id, ptId: ptSteri.id, status: 'submitted', note: 'IPAC training completed last quarter.' },
  ];

  const quals = [];
  for (const q of qualData) {
    const qual = await prisma.qualification.create({
      data: {
        user_id: q.userId,
        position_type_id: q.ptId,
        status: q.status,
        note: q.note
      }
    });
    quals.push(qual);
  }

  // ---- Jobs (30+) ----
  const now = new Date();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  function future(hours) {
    return new Date(now.getTime() + hours * hour);
  }

  const jobsData = [
    // Open jobs - enough time for negotiation
    { bizId: businesses[0].id, ptId: ptHygienist.id, salMin: 38, salMax: 45, start: future(4), end: future(12), status: 'open', note: 'Morning hygienist needed urgently.' },
    { bizId: businesses[0].id, ptId: ptDA1.id, salMin: 25, salMax: 30, start: future(6), end: future(14), status: 'open', note: 'Assisting for routine checkups.' },
    { bizId: businesses[1].id, ptId: ptHygienist.id, salMin: 40, salMax: 48, start: future(5), end: future(13), status: 'open', note: 'Experienced hygienist for a full day.' },
    { bizId: businesses[1].id, ptId: ptDA2.id, salMin: 30, salMax: 37, start: future(8), end: future(16), status: 'open', note: 'Need DA level 2 for coronal polishing.' },
    { bizId: businesses[2].id, ptId: ptReception.id, salMin: 22, salMax: 28, start: future(4), end: future(12), status: 'open', note: 'Dental receptionist for maternity cover.' },
    { bizId: businesses[2].id, ptId: ptHygienist.id, salMin: 42, salMax: 50, start: future(24), end: future(32), status: 'open', note: '' },
    { bizId: businesses[3].id, ptId: ptDA1.id, salMin: 24, salMax: 29, start: future(3), end: future(11), status: 'open', note: '' },
    { bizId: businesses[3].id, ptId: ptPerio.id, salMin: 45, salMax: 55, start: future(5), end: future(13), status: 'open', note: 'Periodontal therapy specialist needed.' },
    { bizId: businesses[4].id, ptId: ptSteri.id, salMin: 20, salMax: 25, start: future(4), end: future(8), status: 'open', note: 'Half day sterilization coverage.' },
    { bizId: businesses[4].id, ptId: ptHygienist.id, salMin: 38, salMax: 44, start: future(48), end: future(56), status: 'open', note: '' },
    { bizId: businesses[5].id, ptId: ptDA2.id, salMin: 32, salMax: 38, start: future(6), end: future(14), status: 'open', note: 'Looking for reliable DA2.' },
    { bizId: businesses[5].id, ptId: ptReception.id, salMin: 23, salMax: 27, start: future(4), end: future(12), status: 'open', note: '' },
    { bizId: businesses[6].id, ptId: ptHygienist.id, salMin: 39, salMax: 46, start: future(72), end: future(80), status: 'open', note: '' },
    { bizId: businesses[6].id, ptId: ptDA1.id, salMin: 24, salMax: 28, start: future(3), end: future(11), status: 'open', note: '' },
    { bizId: businesses[7].id, ptId: ptSteri.id, salMin: 21, salMax: 26, start: future(4), end: future(12), status: 'open', note: '' },
    { bizId: businesses[7].id, ptId: ptPerio.id, salMin: 46, salMax: 56, start: future(6), end: future(14), status: 'open', note: '' },
    { bizId: businesses[8].id, ptId: ptHygienist.id, salMin: 37, salMax: 43, start: future(5), end: future(13), status: 'open', note: '' },
    { bizId: businesses[8].id, ptId: ptReception.id, salMin: 22, salMax: 26, start: future(24), end: future(32), status: 'open', note: '' },
    { bizId: businesses[9].id, ptId: ptDA2.id, salMin: 31, salMax: 36, start: future(4), end: future(12), status: 'open', note: '' },
    { bizId: businesses[9].id, ptId: ptDA1.id, salMin: 25, salMax: 30, start: future(6), end: future(14), status: 'open', note: '' },
    // Filled jobs
    { bizId: businesses[0].id, ptId: ptHygienist.id, salMin: 40, salMax: 47, start: new Date(now.getTime() - 2 * hour), end: new Date(now.getTime() + 6 * hour), status: 'filled', workerId: users[0].id, note: 'Currently in progress.' },
    { bizId: businesses[1].id, ptId: ptDA1.id, salMin: 25, salMax: 30, start: new Date(now.getTime() + 2 * hour), end: new Date(now.getTime() + 10 * hour), status: 'filled', workerId: users[1].id, note: '' },
    { bizId: businesses[2].id, ptId: ptPerio.id, salMin: 44, salMax: 52, start: new Date(now.getTime() + 5 * hour), end: new Date(now.getTime() + 13 * hour), status: 'filled', workerId: users[6].id, note: '' },
    { bizId: businesses[3].id, ptId: ptHygienist.id, salMin: 38, salMax: 45, start: new Date(now.getTime() - 10 * day), end: new Date(now.getTime() - 10 * day + 8 * hour), status: 'filled', workerId: users[9].id, note: '' },
    { bizId: businesses[4].id, ptId: ptDA2.id, salMin: 30, salMax: 36, start: new Date(now.getTime() - 5 * day), end: new Date(now.getTime() - 5 * day + 8 * hour), status: 'filled', workerId: users[17].id, note: '' },
    // Canceled (no-show)
    { bizId: businesses[5].id, ptId: ptDA1.id, salMin: 24, salMax: 29, start: new Date(now.getTime() - 3 * day), end: new Date(now.getTime() - 3 * day + 8 * hour), status: 'canceled', workerId: users[10].id, note: '' },
    // Expired jobs
    { bizId: businesses[6].id, ptId: ptHygienist.id, salMin: 38, salMax: 44, start: new Date(now.getTime() + 0.1 * hour), end: new Date(now.getTime() + 8.1 * hour), status: 'open', note: 'This posting is about to expire.' },
    { bizId: businesses[7].id, ptId: ptSteri.id, salMin: 20, salMax: 24, start: new Date(now.getTime() + 0.2 * hour), end: new Date(now.getTime() + 4.2 * hour), status: 'open', note: '' },
    { bizId: businesses[0].id, ptId: ptRDT.id, salMin: 35, salMax: 42, start: future(5), end: future(13), status: 'open', note: 'Lab technologist needed.' },
    { bizId: businesses[1].id, ptId: ptSteri.id, salMin: 21, salMax: 25, start: future(4), end: future(12), status: 'open', note: '' },
    { bizId: businesses[2].id, ptId: ptDA2.id, salMin: 30, salMax: 38, start: future(6), end: future(14), status: 'open', note: '' },
    { bizId: businesses[3].id, ptId: ptReception.id, salMin: 23, salMax: 28, start: future(5), end: future(13), status: 'open', note: '' },
    { bizId: businesses[4].id, ptId: ptPerio.id, salMin: 44, salMax: 53, start: future(24), end: future(32), status: 'open', note: '' },
    // Extra jobs for business1 to ensure My Jobs page has pagination (need 11+)
    { bizId: businesses[0].id, ptId: ptHygienist.id, salMin: 41, salMax: 49, start: future(36), end: future(44), status: 'open', note: 'Weekend hygienist needed.' },
    { bizId: businesses[0].id, ptId: ptDA1.id, salMin: 26, salMax: 31, start: future(48), end: future(56), status: 'open', note: '' },
    { bizId: businesses[0].id, ptId: ptDA2.id, salMin: 32, salMax: 39, start: future(24), end: future(32), status: 'open', note: '' },
    { bizId: businesses[0].id, ptId: ptReception.id, salMin: 23, salMax: 27, start: future(6), end: future(14), status: 'open', note: '' },
    { bizId: businesses[0].id, ptId: ptSteri.id, salMin: 21, salMax: 26, start: future(12), end: future(20), status: 'open', note: '' },
    { bizId: businesses[0].id, ptId: ptPerio.id, salMin: 47, salMax: 56, start: future(72), end: future(80), status: 'open', note: '' },
    { bizId: businesses[0].id, ptId: ptHygienist.id, salMin: 39, salMax: 46, start: future(96), end: future(104), status: 'open', note: '' },
    { bizId: businesses[5].id, ptId: ptHygienist.id, salMin: 40, salMax: 47, start: future(36), end: future(44), status: 'open', note: '' },
    { bizId: businesses[6].id, ptId: ptHygienist.id, salMin: 38, salMax: 45, start: future(48), end: future(56), status: 'open', note: '' },
    { bizId: businesses[7].id, ptId: ptHygienist.id, salMin: 41, salMax: 48, start: future(24), end: future(32), status: 'open', note: '' },
    { bizId: businesses[8].id, ptId: ptHygienist.id, salMin: 39, salMax: 46, start: future(72), end: future(80), status: 'open', note: '' },
  ];

  const jobs = [];
  for (const j of jobsData) {
    const job = await prisma.job.create({
      data: {
        business_id: j.bizId,
        position_type_id: j.ptId,
        salary_min: j.salMin,
        salary_max: j.salMax,
        start_time: j.start,
        end_time: j.end,
        status: j.status || 'open',
        worker_id: j.workerId || null,
        note: j.note || ''
      }
    });
    jobs.push(job);
  }

  // ---- Interests ----
  // mutual interests (candidate_interested: true, business_interested: true) enable negotiation
  // one-sided: either party has expressed interest, waiting for the other
  // business-only: business invited the user (candidate_interested: null)
  const int1 = await prisma.interest.create({ data: { job_id: jobs[1].id, user_id: users[0].id, candidate_interested: true, business_interested: true } });
  await prisma.interest.create({ data: { job_id: jobs[0].id, user_id: users[1].id, candidate_interested: true, business_interested: null } });
  const int3 = await prisma.interest.create({ data: { job_id: jobs[2].id, user_id: users[2].id, candidate_interested: true, business_interested: true } });
  await prisma.interest.create({ data: { job_id: jobs[7].id, user_id: users[6].id, candidate_interested: true, business_interested: true } });
  await prisma.interest.create({ data: { job_id: jobs[8].id, user_id: users[8].id, candidate_interested: true, business_interested: null } });
  await prisma.interest.create({ data: { job_id: jobs[9].id, user_id: users[9].id, candidate_interested: true, business_interested: true } });
  await prisma.interest.create({ data: { job_id: jobs[0].id, user_id: users[0].id, candidate_interested: null, business_interested: true } });
  await prisma.interest.create({ data: { job_id: jobs[12].id, user_id: users[12].id, candidate_interested: true, business_interested: true } });
  await prisma.interest.create({ data: { job_id: jobs[16].id, user_id: users[18].id, candidate_interested: true, business_interested: true } });
  await prisma.interest.create({ data: { job_id: jobs[18].id, user_id: users[17].id, candidate_interested: true, business_interested: true } });
  // interests for filled jobs
  await prisma.interest.create({ data: { job_id: jobs[20].id, user_id: users[0].id, candidate_interested: true, business_interested: true } });
  await prisma.interest.create({ data: { job_id: jobs[21].id, user_id: users[1].id, candidate_interested: true, business_interested: true } });
  await prisma.interest.create({ data: { job_id: jobs[22].id, user_id: users[6].id, candidate_interested: true, business_interested: true } });
  await prisma.interest.create({ data: { job_id: jobs[23].id, user_id: users[9].id, candidate_interested: true, business_interested: true } });
  await prisma.interest.create({ data: { job_id: jobs[24].id, user_id: users[17].id, candidate_interested: true, business_interested: true } });

  console.log('✅ Seed complete!');
  console.log(`   ${positionTypes.length} position types`);
  console.log(`   1 admin`);
  console.log(`   ${businesses.length} businesses`);
  console.log(`   ${users.length} regular users`);
  console.log(`   ${quals.length} qualifications`);
  console.log(`   ${jobs.length} job postings`);
  console.log('');
  console.log('   Login credentials (password: 123123):');
  console.log('   Admin:    admin1@csc309.utoronto.ca');
  console.log('   Business: business1@csc309.utoronto.ca');
  console.log('   User:     regular1@csc309.utoronto.ca');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
