// Async API Layer mirroring backend contracts
const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

export const studentApi = {
  async getProfile(store) {
    await delay();
    return JSON.parse(JSON.stringify(store.currentStudent));
  },

  async submitProfile(store, skills, resumeFile) {
    await delay(700);
    store.submitProfile(skills, resumeFile);
    return { success: true, message: 'Profile submitted for verification' };
  },

  async getDrives(store) {
    await delay();
    return JSON.parse(JSON.stringify(store.drives));
  },

  async applyToDrive(store, driveId) {
    await delay(800);
    const result = store.applyToDrive(driveId);
    return result;
  },

  async getApplications(store) {
    await delay();
    return JSON.parse(JSON.stringify(store.applications));
  },

  async getInterviews(store) {
    await delay();
    return JSON.parse(JSON.stringify(store.studentInterviews));
  },
};

export const adminApi = {
  async getVerificationQueue(store) {
    await delay();
    return JSON.parse(JSON.stringify(store.verificationQueue));
  },

  async approveStudent(store, studentId) {
    await delay(500);
    store.approveStudent(studentId);
    return { success: true };
  },

  async rejectStudent(store, studentId) {
    await delay(500);
    store.rejectStudent(studentId);
    return { success: true };
  },

  async getDrives(store) {
    await delay();
    return JSON.parse(JSON.stringify(store.drives));
  },

  async resolveConflict(store, driveId) {
    await delay(600);
    store.resolveDriveConflict(driveId);
    return { success: true };
  },

  async getAtRiskStudents(store) {
    await delay();
    return JSON.parse(JSON.stringify(store.atRisk));
  },

  async assignMentor(store, riskId, mentorName) {
    await delay(400);
    store.assignMentor(riskId, mentorName);
    return { success: true };
  },

  async getRecruiterPartners(store) {
    await delay();
    return JSON.parse(JSON.stringify(store.analytics.recruiterPartners));
  },
};

export const recruiterApi = {
  async getPipeline(store) {
    await delay();
    return JSON.parse(JSON.stringify(store.pipeline));
  },

  async scheduleSlot(store, candidateId, slotTime, slotDate) {
    await delay(600);
    store.scheduleInterviewSlot(candidateId, slotTime, slotDate);
    return { success: true };
  },

  async getAnalytics(store) {
    await delay();
    return {
      funnel: store.analytics.recruiterFunnel,
      branchBreakdown: store.analytics.recruiterBranchBreakdown,
      matchDistribution: store.analytics.aiMatchDistribution,
    };
  },
};

export const offersApi = {
  async getOffers(store) {
    await delay();
    return JSON.parse(JSON.stringify(store.offers));
  },

  async sendReminder(store, offerId) {
    await delay(400);
    store.sendOfferReminder(offerId);
    return { success: true };
  },
};

export const analyticsApi = {
  async getOverview(store) {
    await delay();
    return JSON.parse(JSON.stringify(store.analytics));
  },
};

export const notificationsApi = {
  async getNotifications(store, role) {
    await delay(200);
    return JSON.parse(JSON.stringify(store.notifications[role] || []));
  },
};

