const prisma = require('../utils/prisma');

const auditLog = async (adminId, action, resource, details = null, ipAddress = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        resource,
        details,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

module.exports = { auditLog };

