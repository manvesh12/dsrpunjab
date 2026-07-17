import { PrismaClient, ProjectStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data (if any)...');
  await prisma.notification.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.workflowHistory.deleteMany();
  await prisma.report.deleteMany();
  await prisma.replenishmentStudy.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.module.deleteMany();
  await prisma.district.deleteMany();
  await prisma.state.deleteMany();

  // Create State
  console.log('Creating State...');
  const state = await prisma.state.create({
    data: { name: 'Punjab', code: 'PB' }
  });

  // Create Districts
  console.log('Creating Districts...');
  const distLdh = await prisma.district.create({ data: { name: 'Ludhiana', code: 'LDH', stateId: state.id } });
  const distAmr = await prisma.district.create({ data: { name: 'Amritsar', code: 'AMR', stateId: state.id } });
  const distMhl = await prisma.district.create({ data: { name: 'SAS Nagar', code: 'SAS', stateId: state.id } });

  // Create Modules and Permissions
  console.log('Creating Modules & Permissions...');
  const modulesData = [
    { name: 'DASHBOARD', permissions: ['VIEW'] },
    { name: 'PROJECT', permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
    { name: 'REPORT', permissions: ['VIEW', 'GENERATE', 'DOWNLOAD', 'APPROVE'] },
    { name: 'USER', permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
    { name: 'ROLE', permissions: ['VIEW', 'CREATE'] }
  ];

  const createdModules: any = {};
  for (const m of modulesData) {
    const mod = await prisma.module.create({
      data: {
        name: m.name,
        permissions: {
          create: m.permissions.map(p => ({ action: `${m.name}_${p}` }))
        }
      },
      include: { permissions: true }
    });
    createdModules[m.name] = mod;
  }

  // Helper to get permission IDs
  const getPermIds = (modName: string, actions: string[]) => {
    return createdModules[modName].permissions
      .filter((p: any) => actions.includes(p.action.split('_')[1]))
      .map((p: any) => ({ permissionId: p.id }));
  };

  // Create Roles
  console.log('Creating Roles...');
  const roleSuperAdmin = await prisma.role.create({
    data: {
      name: 'SUPER_ADMIN',
      permissions: {
        create: [
          ...getPermIds('DASHBOARD', ['VIEW']),
          ...getPermIds('PROJECT', ['VIEW', 'CREATE', 'EDIT', 'DELETE']),
          ...getPermIds('REPORT', ['VIEW', 'GENERATE', 'DOWNLOAD', 'APPROVE']),
          ...getPermIds('USER', ['VIEW', 'CREATE', 'EDIT', 'DELETE']),
          ...getPermIds('ROLE', ['VIEW', 'CREATE'])
        ]
      }
    }
  });

  const roleStateAdmin = await prisma.role.create({
    data: {
      name: 'STATE_ADMIN',
      permissions: {
        create: [
          ...getPermIds('DASHBOARD', ['VIEW']),
          ...getPermIds('PROJECT', ['VIEW', 'CREATE', 'EDIT', 'DELETE']),
          ...getPermIds('REPORT', ['VIEW', 'GENERATE', 'DOWNLOAD', 'APPROVE']),
          ...getPermIds('USER', ['VIEW', 'CREATE', 'EDIT', 'DELETE'])
        ]
      }
    }
  });

  const roleDistrictAdmin = await prisma.role.create({
    data: {
      name: 'DISTRICT_ADMIN',
      permissions: {
        create: [
          ...getPermIds('DASHBOARD', ['VIEW']),
          ...getPermIds('PROJECT', ['VIEW', 'CREATE', 'EDIT']),
          ...getPermIds('REPORT', ['VIEW', 'GENERATE', 'APPROVE']),
          ...getPermIds('USER', ['VIEW', 'CREATE'])
        ]
      }
    }
  });

  const roleDistrictOfficer = await prisma.role.create({
    data: {
      name: 'DISTRICT_OFFICER',
      permissions: {
        create: [
          ...getPermIds('DASHBOARD', ['VIEW']),
          ...getPermIds('PROJECT', ['VIEW', 'CREATE', 'EDIT']),
          ...getPermIds('REPORT', ['VIEW', 'GENERATE'])
        ]
      }
    }
  });

  const roleGeologist = await prisma.role.create({
    data: {
      name: 'GEOLOGIST',
      permissions: {
        create: [
          ...getPermIds('DASHBOARD', ['VIEW']),
          ...getPermIds('PROJECT', ['VIEW']),
          ...getPermIds('REPORT', ['VIEW'])
        ]
      }
    }
  });

  const roleSurveyOfficer = await prisma.role.create({
    data: {
      name: 'SURVEY_OFFICER',
      permissions: {
        create: [
          ...getPermIds('DASHBOARD', ['VIEW']),
          ...getPermIds('PROJECT', ['VIEW', 'EDIT']),
          ...getPermIds('REPORT', ['VIEW', 'GENERATE'])
        ]
      }
    }
  });

  const roleReviewer = await prisma.role.create({
    data: {
      name: 'REVIEWER',
      permissions: {
        create: [
          ...getPermIds('DASHBOARD', ['VIEW']),
          ...getPermIds('PROJECT', ['VIEW']),
          ...getPermIds('REPORT', ['VIEW', 'APPROVE'])
        ]
      }
    }
  });

  const roleDEO = await prisma.role.create({
    data: {
      name: 'DATA_ENTRY_OPERATOR',
      permissions: {
        create: [
          ...getPermIds('DASHBOARD', ['VIEW']),
          ...getPermIds('PROJECT', ['VIEW', 'CREATE', 'EDIT'])
        ]
      }
    }
  });

  const roleReportGen = await prisma.role.create({
    data: {
      name: 'REPORT_GENERATOR',
      permissions: {
        create: [
          ...getPermIds('DASHBOARD', ['VIEW']),
          ...getPermIds('REPORT', ['VIEW', 'GENERATE', 'DOWNLOAD'])
        ]
      }
    }
  });

  // Hash Password
  console.log('Hashing Password...');
  const passwordHash = await bcrypt.hash('Gov@2026!Secure', 10);

  // Users Mapping
  const usersToCreate = [
    { username: 'super.admin', name: 'Paramjit Singh', email: 'paramjit.singh@punjab.gov.in', role: 'SUPER_ADMIN' },
    { username: 'state.admin', name: 'Manpreet Kaur', email: 'manpreet.kaur@punjab.gov.in', role: 'STATE_ADMIN' },

    // Ludhiana
    { username: 'admin.ldh', name: 'District Admin LDH', email: 'admin.ldh@punjab.gov.in', role: 'DISTRICT_ADMIN', dist: distLdh.id },
    { username: 'officer1.ldh', name: 'Officer One LDH', email: 'officer1.ldh@punjab.gov.in', role: 'DISTRICT_OFFICER', dist: distLdh.id },
    { username: 'officer2.ldh', name: 'Officer Two LDH', email: 'officer2.ldh@punjab.gov.in', role: 'DISTRICT_OFFICER', dist: distLdh.id },
    { username: 'geologist.ldh', name: 'Geologist LDH', email: 'geo.ldh@punjab.gov.in', role: 'GEOLOGIST', dist: distLdh.id },
    { username: 'surveyor.ldh', name: 'Surveyor LDH', email: 'survey.ldh@punjab.gov.in', role: 'SURVEY_OFFICER', dist: distLdh.id },
    { username: 'reviewer.ldh', name: 'Reviewer LDH', email: 'review.ldh@punjab.gov.in', role: 'REVIEWER', dist: distLdh.id },
    { username: 'deo1.ldh', name: 'DEO One LDH', email: 'deo1.ldh@punjab.gov.in', role: 'DATA_ENTRY_OPERATOR', dist: distLdh.id },
    { username: 'deo2.ldh', name: 'DEO Two LDH', email: 'deo2.ldh@punjab.gov.in', role: 'DATA_ENTRY_OPERATOR', dist: distLdh.id },
    { username: 'reportgen.ldh', name: 'Report Gen LDH', email: 'report.ldh@punjab.gov.in', role: 'REPORT_GENERATOR', dist: distLdh.id },

    // Amritsar
    { username: 'admin.amr', name: 'District Admin AMR', email: 'admin.amr@punjab.gov.in', role: 'DISTRICT_ADMIN', dist: distAmr.id },
    { username: 'officer1.amr', name: 'Officer One AMR', email: 'officer1.amr@punjab.gov.in', role: 'DISTRICT_OFFICER', dist: distAmr.id },
    { username: 'officer2.amr', name: 'Officer Two AMR', email: 'officer2.amr@punjab.gov.in', role: 'DISTRICT_OFFICER', dist: distAmr.id },
    { username: 'geologist.amr', name: 'Geologist AMR', email: 'geo.amr@punjab.gov.in', role: 'GEOLOGIST', dist: distAmr.id },
    { username: 'surveyor.amr', name: 'Surveyor AMR', email: 'survey.amr@punjab.gov.in', role: 'SURVEY_OFFICER', dist: distAmr.id },
    { username: 'reviewer.amr', name: 'Reviewer AMR', email: 'review.amr@punjab.gov.in', role: 'REVIEWER', dist: distAmr.id },
    { username: 'deo1.amr', name: 'DEO One AMR', email: 'deo1.amr@punjab.gov.in', role: 'DATA_ENTRY_OPERATOR', dist: distAmr.id },
    { username: 'deo2.amr', name: 'DEO Two AMR', email: 'deo2.amr@punjab.gov.in', role: 'DATA_ENTRY_OPERATOR', dist: distAmr.id },
    { username: 'reportgen.amr', name: 'Report Gen AMR', email: 'report.amr@punjab.gov.in', role: 'REPORT_GENERATOR', dist: distAmr.id },

    // SAS Nagar
    { username: 'admin.mhl', name: 'District Admin MHL', email: 'admin.mhl@punjab.gov.in', role: 'DISTRICT_ADMIN', dist: distMhl.id },
    { username: 'officer1.mhl', name: 'Officer One MHL', email: 'officer1.mhl@punjab.gov.in', role: 'DISTRICT_OFFICER', dist: distMhl.id },
    { username: 'officer2.mhl', name: 'Officer Two MHL', email: 'officer2.mhl@punjab.gov.in', role: 'DISTRICT_OFFICER', dist: distMhl.id },
    { username: 'geologist.mhl', name: 'Geologist MHL', email: 'geo.mhl@punjab.gov.in', role: 'GEOLOGIST', dist: distMhl.id },
    { username: 'surveyor.mhl', name: 'Surveyor MHL', email: 'survey.mhl@punjab.gov.in', role: 'SURVEY_OFFICER', dist: distMhl.id },
    { username: 'reviewer.mhl', name: 'Reviewer MHL', email: 'review.mhl@punjab.gov.in', role: 'REVIEWER', dist: distMhl.id },
    { username: 'deo1.mhl', name: 'DEO One MHL', email: 'deo1.mhl@punjab.gov.in', role: 'DATA_ENTRY_OPERATOR', dist: distMhl.id },
    { username: 'deo2.mhl', name: 'DEO Two MHL', email: 'deo2.mhl@punjab.gov.in', role: 'DATA_ENTRY_OPERATOR', dist: distMhl.id },
    { username: 'reportgen.mhl', name: 'Report Gen MHL', email: 'report.mhl@punjab.gov.in', role: 'REPORT_GENERATOR', dist: distMhl.id },
  ];

  console.log('Seeding 36 Users...');
  const createdUsers: any[] = [];
  for (const u of usersToCreate) {
    const created = await prisma.user.create({
      data: {
        username: u.username,
        email: u.email,
        password: passwordHash,
        fullName: u.name,
        role: u.role,
        districtId: u.dist || null,
        stateId: state.id,
        active: true,
      }
    });
    createdUsers.push(created);
  }

  const districtConfigs = [
    { district: distLdh, prefix: "LDH", idStart: 1000 },
    { district: distAmr, prefix: "AMR", idStart: 2000 },
    { district: distMhl, prefix: "MHL", idStart: 3000 }
  ];

  console.log("Seeding Projects...");
  for (const dc of districtConfigs) {
    const dsrProject = await prisma.project.create({
      data: {
        projectName: `DSR ${dc.district.name} 2026`,
        projectCode: `DSR-${dc.prefix}-2026`,
        districtId: dc.district.id,
        year: "2026",
        status: ProjectStatus.IN_PROGRESS
      }
    });

    const repProject = await prisma.project.create({
      data: {
        projectName: `Replenishment ${dc.district.name} 2026`,
        projectCode: `REP-${dc.prefix}-2026`,
        districtId: dc.district.id,
        year: "2026",
        status: ProjectStatus.IN_PROGRESS
      }
    });

    // Assign users to project members
    const districtUsers = createdUsers.filter(u => String(u.districtId) === String(dc.district.id));
    for (const u of districtUsers) {
      await prisma.projectMember.create({
        data: { projectId: dsrProject.id, userId: u.id, role: u.role }
      });
      await prisma.projectMember.create({
        data: { projectId: repProject.id, userId: u.id, role: u.role }
      });
    }

    // Seed Notification and AuditLog
    const admin = districtUsers.find(u => u.role === "DISTRICT_ADMIN");
    if (admin) {
      await prisma.notification.create({
        data: { userId: admin.id, type: "PROJECT_ASSIGNED", message: `You have been assigned to project ${dsrProject.projectName}` }
      });
      await prisma.auditLog.create({
        data: { userId: admin.id, action: "PROJECT_CREATED", method: "POST", path: "/api/projects", metadata: { projectId: dsrProject.id.toString() } }
      });
    }
  }

  console.log('Seed Complete!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
