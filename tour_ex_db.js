// ===============================
// DATABASE
// ===============================
use("tour-ex_db");

// ===============================
// CLEAN (opcional, cuidado en producción)
// ===============================
db.users.drop();
db.destinations.drop();
db.reservations.drop();
db.payments.drop();

// ===============================
// USERS
// ===============================
const users = [
  {
    _id: ObjectId("6a4aac332e75cd42c2c6e1e9"),
    active: true,
    available_time: 4,
    birth_date: ISODate("2004-01-01"),
    budget: 500,
    email: "alejandro@tourex.com",
    "password": "123456789",
    name: "Alejandro",
    surnames: "Soto Cárdenas",
    role: "admin"
  },
  {
    _id: ObjectId("6a3876ad534686764d1b02bf"),
    active: true,
    available_time: 8,
    birth_date: ISODate("2000-01-01"),
    budget: 250,
    email: "admin@tourex.com",
    "password": "123456789",
    name: "Admin",
    surnames: "Tourex",
    role: "admin"
  },
  {
    _id: ObjectId("6a10c4d21bba9feda37e6ed2"),
    active: true,
    available_time: 2,
    birth_date: ISODate("2001-01-01"),
    budget: 1450,
    email: "cesia.lizarbe@vallegrande.edu.pe",
    "password": "123456789",
    name: "Cesia",
    surnames: "Flores Quispe",
    role: "user"
  }
];

db.users.insertMany(users);

// ===============================
// DESTINATIONS
// ===============================
const destinations = [
  {
    _id: ObjectId("6a39e92e4ff0486bb08e0e19"),
    name: "Incahuasi",
    city: "Cañete",
    country: "Perú",
    category: "Paseo Turístico",
    price_estimate: 90,
    active: true
  },
  {
    _id: ObjectId("6a10a74794fd09d0c1b0b8b0"),
    name: "Castillo Unanue",
    city: "San Vicente",
    country: "Perú",
    category: "Histórico",
    price_estimate: 750,
    active: true
  },
  {
    _id: ObjectId("6a3876ad534686764d1b02c0"),
    name: "Lunahuaná",
    city: "Lunahuaná",
    country: "Perú",
    category: "Aventura",
    price_estimate: 80,
    active: true
  }
];

db.destinations.insertMany(destinations);

// ===============================
// RESERVATIONS
// ===============================
const reservations = [
  {
    _id: ObjectId("6a4ac8777b065ee7077f43c8"),
    user_id: ObjectId("6a4aac332e75cd42c2c6e1e9"),
    destination_id: ObjectId("6a39e92e4ff0486bb08e0e19"),
    status: "confirmed",
    reservation_date: ISODate("2026-07-14"),
    travelers: 3,
    unit_price: 90,
    total_price: 270
  },
  {
    _id: ObjectId("6a39ead62201e07c3c858e05"),
    user_id: ObjectId("6a3876ad534686764d1b02bf"),
    destination_id: ObjectId("6a39e92e4ff0486bb08e0e19"),
    status: "pending",
    reservation_date: ISODate("2026-06-30"),
    travelers: 6,
    unit_price: 90,
    total_price: 540
  },
  {
    _id: ObjectId("6a3878e6534686764d1b02d9"),
    user_id: ObjectId("6a10c4d21bba9feda37e6ed2"),
    destination_id: ObjectId("6a10a74794fd09d0c1b0b8b0"),
    status: "confirmed",
    reservation_date: ISODate("2026-06-21"),
    travelers: 1,
    unit_price: 750,
    total_price: 750
  },
  {
    _id: ObjectId("6a3877bd534686764d1b02d1"),
    user_id: ObjectId("6a10c4d21bba9feda37e6ed2"),
    destination_id: ObjectId("6a3876ad534686764d1b02c0"),
    status: "pending",
    reservation_date: ISODate("2026-06-21"),
    travelers: 15,
    unit_price: 80,
    total_price: 1200
  }
];

db.reservations.insertMany(reservations);

// ===============================
// PAYMENTS (SOLO CONFIRMED)
// ===============================
const payments = [
  {
    _id: ObjectId("6a4ac87d7b065ee7077f43c9"),
    reservation_id: ObjectId("6a4ac8777b065ee7077f43c8"),
    amount: 270,
    payment_method: "yape",
    status: "paid",
    payment_date: ISODate("2026-07-05T21:11:25Z")
  },
  {
    _id: ObjectId("6a3878e6534686764d1b02da"),
    reservation_id: ObjectId("6a3878e6534686764d1b02d9"),
    amount: 750,
    payment_method: "transfer",
    status: "paid",
    payment_date: ISODate("2026-06-21T23:51:02Z")
  }
];

// VALIDACIÓN: solo confirmed
const confirmedReservations = db.reservations.find({ status: "confirmed" }).toArray();

const validReservationIds = confirmedReservations.map(r => r._id);

const filteredPayments = payments.filter(p =>
  validReservationIds.some(id => id.str === p.reservation_id.str)
);

db.payments.insertMany(filteredPayments);

// ===============================
// INDEXES (RECOMENDADO)
// ===============================
db.reservations.createIndex({ user_id: 1 });
db.reservations.createIndex({ destination_id: 1 });
db.payments.createIndex({ reservation_id: 1 });

print("Seed completado correctamente");
