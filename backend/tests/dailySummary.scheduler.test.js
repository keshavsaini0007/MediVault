jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('../src/models/User', () => ({
  find: jest.fn(),
}));

jest.mock('../src/models/DoseLog', () => ({
  find: jest.fn(),
}));

jest.mock('../src/models/Notification', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../src/services/emailService', () => ({
  sendCaregiverDailyMissedDoseSummary: jest.fn(),
}));

const User = require('../src/models/User');
const DoseLog = require('../src/models/DoseLog');
const Notification = require('../src/models/Notification');
const { sendCaregiverDailyMissedDoseSummary } = require('../src/services/emailService');
const { sendDailySummary } = require('../src/schedulers/dailySummaryScheduler');

const buildDoseFindResult = (doses) => ({
  sort: jest.fn().mockReturnValue({
    populate: jest.fn().mockResolvedValue(doses),
  }),
});

describe('dailySummaryScheduler.sendDailySummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sends one caregiver email summary and creates idempotency notification', async () => {
    const patientId = '65f1f1f1f1f1f1f1f1f1f1f1';
    const medicineId = '65f2f2f2f2f2f2f2f2f2f2f2';

    User.find.mockResolvedValue([
      {
        _id: patientId,
        name: 'Patient One',
        caregiver: {
          name: 'Care Giver',
          email: 'caregiver@example.com',
          phone: '+15555550123',
        },
      },
    ]);

    DoseLog.find.mockReturnValue(
      buildDoseFindResult([
        {
          medicineId: {
            _id: medicineId,
            name: 'Metformin',
            dosage: '500mg',
          },
          scheduledTime: new Date('2026-04-01T09:00:00.000Z'),
        },
        {
          medicineId: {
            _id: medicineId,
            name: 'Metformin',
            dosage: '500mg',
          },
          scheduledTime: new Date('2026-04-01T21:00:00.000Z'),
        },
      ])
    );

    Notification.findOne.mockResolvedValue(null);
    sendCaregiverDailyMissedDoseSummary.mockResolvedValue({ skipped: false, messageId: 'm1' });

    const result = await sendDailySummary({ now: '2026-04-01T23:00:00.000Z' });

    expect(sendCaregiverDailyMissedDoseSummary).toHaveBeenCalledTimes(1);
    expect(sendCaregiverDailyMissedDoseSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        caregiverEmail: 'caregiver@example.com',
        patientName: 'Patient One',
      })
    );
    expect(Notification.create).toHaveBeenCalledTimes(1);
    expect(result.emailSentCount).toBe(1);
    expect(result.duplicateSkippedCount).toBe(0);
  });

  test('skips sending when daily summary was already sent for the date', async () => {
    User.find.mockResolvedValue([
      {
        _id: '65f3f3f3f3f3f3f3f3f3f3f3',
        name: 'Patient Two',
        caregiver: {
          name: 'Care Giver',
          email: 'caregiver2@example.com',
          phone: '+15555550124',
        },
      },
    ]);

    DoseLog.find.mockReturnValue(
      buildDoseFindResult([
        {
          medicineId: {
            _id: '65f4f4f4f4f4f4f4f4f4f4f4',
            name: 'Aspirin',
            dosage: '75mg',
          },
          scheduledTime: new Date('2026-04-01T10:00:00.000Z'),
        },
      ])
    );

    Notification.findOne.mockResolvedValue({ _id: 'existing-summary' });

    const result = await sendDailySummary({ now: '2026-04-01T23:00:00.000Z' });

    expect(sendCaregiverDailyMissedDoseSummary).not.toHaveBeenCalled();
    expect(Notification.create).not.toHaveBeenCalled();
    expect(result.duplicateSkippedCount).toBe(1);
    expect(result.emailSentCount).toBe(0);
  });
});
