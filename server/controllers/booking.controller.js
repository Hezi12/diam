// מחיקת כל ההזמנות 
exports.deleteAllBookings = async (req, res) => {
  try {
    const result = await Booking.deleteAllBookings();
    res.status(200).json({
      success: true,
      message: 'כל ההזמנות נמחקו בהצלחה',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `שגיאה במחיקת ההזמנות: ${error.message}`
    });
  }
}; 