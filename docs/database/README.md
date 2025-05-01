# מבנה בסיס הנתונים של מערכת דיאם

מסמך זה מתאר את הסכמות והמבנה של בסיס הנתונים במערכת דיאם.

## טכנולוגיה

מערכת דיאם משתמשת ב-MongoDB, בסיס נתונים לא-רלציוני (NoSQL) מבוסס מסמכים.

## סכמות עיקריות

### משתמשים (Users)

סכמה המייצגת משתמשי המערכת:

```javascript
{
  _id: ObjectId,
  username: String,
  password: String (מוצפן),
  name: String,
  role: String (admin/clerk),
  createdAt: Date,
  updatedAt: Date
}
```

### הזמנות (Bookings)

סכמה המייצגת הזמנות:

```javascript
{
  _id: ObjectId,
  guestName: String,
  guestPhone: String,
  checkInDate: Date,
  checkOutDate: Date,
  roomId: ObjectId (הפניה לחדר),
  price: Number,
  paymentStatus: String,
  status: String,
  comments: String,
  createdBy: ObjectId (הפניה למשתמש),
  createdAt: Date,
  updatedAt: Date
}
```

### חדרים (Rooms)

סכמה המייצגת את החדרים במלון:

```javascript
{
  _id: ObjectId,
  roomNumber: String,
  site: String (airport/rothschild),
  type: String,
  capacity: Number,
  basePrice: Number,
  amenities: [String],
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### חשבוניות (Invoices)

סכמה המייצגת חשבוניות:

```javascript
{
  _id: ObjectId,
  bookingId: ObjectId (הפניה להזמנה),
  invoiceNumber: String,
  amount: Number,
  issueDate: Date,
  dueDate: Date,
  status: String,
  items: [
    {
      description: String,
      amount: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### ניקיון (Cleaning)

סכמה המייצגת משימות ניקיון:

```javascript
{
  _id: ObjectId,
  roomId: ObjectId (הפניה לחדר),
  scheduledDate: Date,
  status: String,
  cleanedBy: String,
  completedAt: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
``` 