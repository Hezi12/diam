const RoomMapping = require('../models/RoomMapping');
const Room = require('../models/Room');

/**
 * קבלת כל ממירי החדרים למיקום מסוים
 */
exports.getMappingsByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location || !['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({ message: 'מיקום לא תקין' });
    }
    
    const mappings = await RoomMapping.find({ location })
      .populate('primaryRoomId', 'roomNumber category _id')
      .sort({ textToMatch: 1 });
    
    res.json(mappings);
  } catch (error) {
    console.error('שגיאה בקבלת ממירי חדרים:', error);
    res.status(500).json({ message: 'שגיאה בקבלת ממירי חדרים', error: error.message });
  }
};

/**
 * הוספת ממיר חדרים חדש
 */
exports.createMapping = async (req, res) => {
  try {
    const { location, textToMatch, primaryRoomId } = req.body;
    
    // וידוא נתונים חיוניים
    if (!location || !textToMatch || !primaryRoomId) {
      return res.status(400).json({ 
        message: 'חסרים נתונים חיוניים. נדרש: מיקום, טקסט לזיהוי וחדר ראשי' 
      });
    }
    
    // בדיקה אם הממיר כבר קיים
    const existingMapping = await RoomMapping.findOne({ 
      location, 
      textToMatch: textToMatch.trim() 
    });
    
    if (existingMapping) {
      // עדכון ממיר קיים
      existingMapping.primaryRoomId = primaryRoomId;
      await existingMapping.save();
      
      return res.json({ 
        message: 'ממיר החדרים עודכן בהצלחה', 
        mapping: existingMapping 
      });
    }
    
    // יצירת ממיר חדש
    const newMapping = new RoomMapping({
      location,
      textToMatch: textToMatch.trim(),
      primaryRoomId
    });
    
    await newMapping.save();
    
    res.status(201).json({ 
      message: 'ממיר החדרים נוצר בהצלחה', 
      mapping: newMapping 
    });
  } catch (error) {
    console.error('שגיאה ביצירת ממיר חדרים:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'ממיר חדרים עם אותו טקסט כבר קיים במיקום זה' 
      });
    }
    
    res.status(500).json({ 
      message: 'שגיאה ביצירת ממיר חדרים', 
      error: error.message 
    });
  }
};

/**
 * עדכון ממיר חדרים
 */
exports.updateMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const { textToMatch, primaryRoomId } = req.body;
    
    // וידוא נתונים חיוניים
    if (!textToMatch || !primaryRoomId) {
      return res.status(400).json({ 
        message: 'חסרים נתונים חיוניים. נדרש: טקסט לזיהוי וחדר ראשי' 
      });
    }
    
    const mapping = await RoomMapping.findById(id);
    
    if (!mapping) {
      return res.status(404).json({ message: 'ממיר חדרים לא נמצא' });
    }
    
    // עדכון שדות
    mapping.textToMatch = textToMatch.trim();
    mapping.primaryRoomId = primaryRoomId;
    
    await mapping.save();
    
    res.json({ 
      message: 'ממיר החדרים עודכן בהצלחה', 
      mapping 
    });
  } catch (error) {
    console.error('שגיאה בעדכון ממיר חדרים:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'ממיר חדרים עם אותו טקסט כבר קיים במיקום זה' 
      });
    }
    
    res.status(500).json({ 
      message: 'שגיאה בעדכון ממיר חדרים', 
      error: error.message 
    });
  }
};

/**
 * מחיקת ממיר חדרים
 */
exports.deleteMapping = async (req, res) => {
  try {
    const { id } = req.params;
    
    const mapping = await RoomMapping.findById(id);
    
    if (!mapping) {
      return res.status(404).json({ message: 'ממיר חדרים לא נמצא' });
    }
    
    await RoomMapping.deleteOne({ _id: id });
    
    res.json({ message: 'ממיר החדרים נמחק בהצלחה' });
  } catch (error) {
    console.error('שגיאה במחיקת ממיר חדרים:', error);
    res.status(500).json({ 
      message: 'שגיאה במחיקת ממיר חדרים', 
      error: error.message 
    });
  }
};

/**
 * מחיקת כל ממירי החדרים למיקום מסוים
 */
exports.deleteAllMappings = async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location || !['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({ message: 'מיקום לא תקין' });
    }
    
    const result = await RoomMapping.deleteMany({ location });
    
    res.json({ 
      message: `${result.deletedCount} ממירי חדרים נמחקו בהצלחה`, 
      count: result.deletedCount 
    });
  } catch (error) {
    console.error('שגיאה במחיקת ממירי חדרים:', error);
    res.status(500).json({ 
      message: 'שגיאה במחיקת ממירי חדרים', 
      error: error.message 
    });
  }
}; 