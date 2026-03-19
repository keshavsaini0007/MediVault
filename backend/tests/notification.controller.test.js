jest.mock("../models/Notification", () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  updateMany: jest.fn(),
}));

const Notification = require("../models/Notification");
const {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

const buildRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("notificationController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getMyNotifications applies unread/type/date filters and clamps pagination", async () => {
    const notifications = [{ _id: "n1" }, { _id: "n2" }];
    const limitMock = jest.fn().mockResolvedValue(notifications);
    const skipMock = jest.fn(() => ({ limit: limitMock }));
    const sortMock = jest.fn(() => ({ skip: skipMock }));
    Notification.find.mockReturnValue({ sort: sortMock });
    Notification.countDocuments.mockResolvedValue(2);

    const req = {
      user: { id: "507f1f77bcf86cd799439011" },
      query: {
        unreadOnly: "true",
        type: "system",
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-01-31T23:59:59.999Z",
        limit: "999",
        page: "0",
      },
    };
    const res = buildRes();
    const next = jest.fn();

    await getMyNotifications(req, res, next);

    expect(Notification.countDocuments).toHaveBeenCalledTimes(1);
    const filterArg = Notification.countDocuments.mock.calls[0][0];
    expect(filterArg.userId).toBe("507f1f77bcf86cd799439011");
    expect(filterArg.isRead).toBe(false);
    expect(filterArg.type).toBe("system");
    expect(filterArg.createdAt.$gte).toEqual(new Date("2026-01-01T00:00:00.000Z"));
    expect(filterArg.createdAt.$lte).toEqual(new Date("2026-01-31T23:59:59.999Z"));

    expect(skipMock).toHaveBeenCalledWith(0);
    expect(limitMock).toHaveBeenCalledWith(100);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      notifications,
      pagination: {
        total: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("getMyNotifications prioritizes explicit isRead over unreadOnly", async () => {
    const limitMock = jest.fn().mockResolvedValue([]);
    const skipMock = jest.fn(() => ({ limit: limitMock }));
    const sortMock = jest.fn(() => ({ skip: skipMock }));
    Notification.find.mockReturnValue({ sort: sortMock });
    Notification.countDocuments.mockResolvedValue(0);

    const req = {
      user: { id: "507f1f77bcf86cd799439011" },
      query: { isRead: "true", unreadOnly: "true", page: "2", limit: "10" },
    };
    const res = buildRes();

    await getMyNotifications(req, res, jest.fn());

    const filterArg = Notification.countDocuments.mock.calls[0][0];
    expect(filterArg.isRead).toBe(true);
    expect(skipMock).toHaveBeenCalledWith(10);
    expect(limitMock).toHaveBeenCalledWith(10);
  });

  test("getUnreadCount returns total unread and unread-by-type map", async () => {
    Notification.countDocuments.mockResolvedValue(4);
    Notification.aggregate.mockResolvedValue([
      { _id: "system", count: 1 },
      { _id: "dose_missed", count: 3 },
    ]);

    const req = { user: { id: "507f1f77bcf86cd799439011" } };
    const res = buildRes();

    await getUnreadCount(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      unreadCount: 4,
      unreadByType: {
        system: 1,
        dose_missed: 3,
      },
    });
  });

  test("markNotificationRead marks unread notification and saves", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const notification = { _id: "507f1f77bcf86cd799439012", isRead: false, readAt: null, save };
    Notification.findOne.mockResolvedValue(notification);

    const req = {
      params: { id: "507f1f77bcf86cd799439012" },
      user: { id: "507f1f77bcf86cd799439011" },
    };
    const res = buildRes();

    await markNotificationRead(req, res, jest.fn());

    expect(Notification.findOne).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439012",
      userId: "507f1f77bcf86cd799439011",
    });
    expect(notification.isRead).toBe(true);
    expect(notification.readAt).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("markNotificationRead returns 404 for missing notification", async () => {
    Notification.findOne.mockResolvedValue(null);

    const req = {
      params: { id: "507f1f77bcf86cd799439012" },
      user: { id: "507f1f77bcf86cd799439011" },
    };
    const res = buildRes();

    await markNotificationRead(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Notification not found." });
  });

  test("markAllNotificationsRead updates unread notifications", async () => {
    Notification.updateMany.mockResolvedValue({ matchedCount: 5, modifiedCount: 5 });

    const req = { user: { id: "507f1f77bcf86cd799439011" } };
    const res = buildRes();

    await markAllNotificationsRead(req, res, jest.fn());

    expect(Notification.updateMany).toHaveBeenCalledTimes(1);
    const args = Notification.updateMany.mock.calls[0];
    expect(args[0]).toEqual({ userId: "507f1f77bcf86cd799439011", isRead: false });
    expect(args[1].$set.isRead).toBe(true);
    expect(args[1].$set.readAt).toBeInstanceOf(Date);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "All notifications marked as read.",
      matchedCount: 5,
      modifiedCount: 5,
    });
  });
});
