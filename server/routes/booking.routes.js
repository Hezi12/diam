// מחיקת כל ההזמנות
router.delete('/deleteAll', authMiddleware, isAdmin, bookingController.deleteAllBookings); 