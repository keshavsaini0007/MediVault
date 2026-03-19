const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server-core");

const Notification = require("../models/Notification");
const {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

jest.setTimeout(60000);

const buildRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("notification integration", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: { version: "7.0.14" },
    });

    await mongoose.connect(mongoServer.getUri(), {
      dbName: "medivault-test",
    });
  });

  afterEach(async () => {
    await Notification.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  test("getUnreadCount returns unread total and unreadByType from real documents", async () => {
    const userId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();

    await Notification.insertMany([
      {
        userId,
        type: "system",
        title: "A",
        message: "A",
        isRead: false,
      },
      {
        userId,
        type: "dose_missed",
        title: "B",
        message: "B",
        isRead: false,
      },
      {
        userId,
        type: "dose_missed",
        title: "C",
        message: "C",
        isRead: false,
      },
      {
        userId,
        type: "system",
        title: "D",
        message: "D",
        isRead: true,
      },
      {
        userId: otherUserId,
        type: "symptom_urgent",
        title: "E",
        message: "E",
        isRead: false,
      },
    ]);

    const req = { user: { id: userId.toString() } };
    const res = buildRes();
    const next = jest.fn();

    await getUnreadCount(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      unreadCount: 3,
      unreadByType: {
        system: 1,
        dose_missed: 2,
      },
    });
  });

  test("markNotificationRead persists isRead/readAt for notification owner", async () => {
    const userId = new mongoose.Types.ObjectId();
    const notification = await Notification.create({
      userId,
      type: "system",
      title: "Read me",
      message: "Read me",
      isRead: false,
    });

    const req = {
      params: { id: notification._id.toString() },
      user: { id: userId.toString() },
    };
    const res = buildRes();
    const next = jest.fn();

    await markNotificationRead(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);

    const updated = await Notification.findById(notification._id);
    expect(updated.isRead).toBe(true);
    expect(updated.readAt).toBeInstanceOf(Date);
  });

  test("markAllNotificationsRead updates only current user's unread docs", async () => {
    const userId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();

    await Notification.insertMany([
      {
        userId,
        type: "system",
        title: "u1",
        message: "u1",
        isRead: false,
      },
      {
        userId,
        type: "dose_missed",
        title: "u2",
        message: "u2",
        isRead: false,
      },
      {
        userId,
        type: "system",
        title: "already",
        message: "already",
        isRead: true,
      },
      {
        userId: otherUserId,
        type: "system",
        title: "other",
        message: "other",
        isRead: false,
      },
    ]);

    const req = { user: { id: userId.toString() } };
    const res = buildRes();
    const next = jest.fn();

    await markAllNotificationsRead(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);

    const ownUnreadAfter = await Notification.countDocuments({ userId, isRead: false });
    const otherUnreadAfter = await Notification.countDocuments({ userId: otherUserId, isRead: false });

    expect(ownUnreadAfter).toBe(0);
    expect(otherUnreadAfter).toBe(1);

    const payload = res.json.mock.calls[0][0];
    expect(payload.message).toBe("All notifications marked as read.");
    expect(payload.matchedCount).toBe(2);
    expect(payload.modifiedCount).toBe(2);
  });

  test("getMyNotifications applies real date/type filters with pagination", async () => {
    const userId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();

    const rows = await Notification.insertMany([
      {
        userId,
        type: "system",
        title: "old-system",
        message: "old-system",
        isRead: false,
      },
      {
        userId,
        type: "system",
        title: "mid-system",
        message: "mid-system",
        isRead: false,
      },
      {
        userId,
        type: "system",
        title: "new-system",
        message: "new-system",
        isRead: false,
      },
      {
        userId,
        type: "dose_missed",
        title: "other-type",
        message: "other-type",
        isRead: false,
      },
      {
        userId: otherUserId,
        type: "system",
        title: "other-user",
        message: "other-user",
        isRead: false,
      },
    ]);

    await Notification.bulkWrite([
      {
        updateOne: {
          filter: { _id: rows[0]._id },
          update: {
            $set: {
              createdAt: new Date("2026-01-10T10:00:00.000Z"),
              updatedAt: new Date("2026-01-10T10:00:00.000Z"),
            },
          },
        },
      },
      {
        updateOne: {
          filter: { _id: rows[1]._id },
          update: {
            $set: {
              createdAt: new Date("2026-01-15T10:00:00.000Z"),
              updatedAt: new Date("2026-01-15T10:00:00.000Z"),
            },
          },
        },
      },
      {
        updateOne: {
          filter: { _id: rows[2]._id },
          update: {
            $set: {
              createdAt: new Date("2026-01-20T10:00:00.000Z"),
              updatedAt: new Date("2026-01-20T10:00:00.000Z"),
            },
          },
        },
      },
      {
        updateOne: {
          filter: { _id: rows[3]._id },
          update: {
            $set: {
              createdAt: new Date("2026-01-18T10:00:00.000Z"),
              updatedAt: new Date("2026-01-18T10:00:00.000Z"),
            },
          },
        },
      },
      {
        updateOne: {
          filter: { _id: rows[4]._id },
          update: {
            $set: {
              createdAt: new Date("2026-01-19T10:00:00.000Z"),
              updatedAt: new Date("2026-01-19T10:00:00.000Z"),
            },
          },
        },
      },
    ]);

    const req = {
      user: { id: userId.toString() },
      query: {
        type: "system",
        from: "2026-01-12T00:00:00.000Z",
        to: "2026-01-25T00:00:00.000Z",
        limit: "1",
        page: "2",
      },
    };
    const res = buildRes();
    const next = jest.fn();

    await getMyNotifications(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);

    const payload = res.json.mock.calls[0][0];
    expect(payload.pagination.total).toBe(2);
    expect(payload.pagination.page).toBe(2);
    expect(payload.pagination.limit).toBe(1);
    expect(payload.pagination.totalPages).toBe(2);
    expect(payload.pagination.hasNextPage).toBe(false);
    expect(payload.pagination.hasPrevPage).toBe(true);

    expect(payload.notifications).toHaveLength(1);
    expect(payload.notifications[0].title).toBe("mid-system");
  });
});
