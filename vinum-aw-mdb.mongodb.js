// ======================================================
// BASE DE DATOS: VINUM AW DB
// SCRIPT CONSISTENTE Y ORDENADO
// ======================================================

// ======================================================
// SELECCIÓN DE BASE DE DATOS
// ======================================================

use("vinum-aw-db")

// ======================================================
// LIMPIEZA OPCIONAL DE COLECCIONES
// (Descomentar si se desea reiniciar datos)
// ======================================================

// db.client.drop()
// db.employee.drop()
// db.products.drop()
// db.locations.drop()
// db.supplier.drop()
// db.supplies.drop()
// db.payment_method.drop()
// db.sale.drop()
// db.purchases.drop()
// db.sale_analytics.drop()
// db.platform_user.drop()

// ======================================================
// COLECCIÓN: CLIENT
// ======================================================

db.client.insertMany([
  {
    name: "Carlos",
    surname: "Ramirez Torres",
    phoneNum: "987654321",
    email: "carlos@gmail.com",
    age: 30,
    docType: "DNI",
    docNum: "45678912",
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Lucia",
    surname: "Fernandez Soto",
    phoneNum: "912345678",
    email: "lucia@gmail.com",
    age: 25,
    docType: "DNI",
    docNum: "78965412",
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Miguel",
    surname: "Torres Diaz",
    phoneNum: "911223344",
    email: "miguel@gmail.com",
    age: 40,
    docType: "DNI",
    docNum: "12345678",
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Andrea",
    surname: "Paredes Silva",
    phoneNum: "922334455",
    email: "andrea@gmail.com",
    age: 28,
    docType: "DNI",
    docNum: "87654321",
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Fernando",
    surname: "Rojas Castillo",
    phoneNum: "933445566",
    email: "fernando@gmail.com",
    age: 35,
    docType: "CE",
    docNum: "CE987654",
    status: true,
    addedAt: ISODate()
  }
])

// ======================================================
// COLECCIÓN: EMPLOYEE
// ======================================================

db.employee.insertMany([
  {
    name: "Ana",
    surname: "Lopez Vargas",
    phoneNum: "934567890",
    email: "ana@gmail.com",
    age: 24,
    docType: "DNI",
    docNum: "45612378",
    position: "Administrador",
    salary: 2800,
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Luis",
    surname: "Garcia Ruiz",
    phoneNum: "945678901",
    email: "garcia@hotmail.com",
    age: 34,
    docType: "DNI",
    docNum: "74125896",
    position: "Vendedor",
    salary: 1800,
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Pedro",
    surname: "Sanchez Cruz",
    phoneNum: "944556677",
    email: "pedro@gmail.com",
    age: 29,
    docType: "DNI",
    docNum: "15975346",
    position: "Vendedor",
    salary: 1700,
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Maria",
    surname: "Quispe Huaman",
    phoneNum: "955667788",
    email: "maria@gmail.com",
    age: 31,
    docType: "DNI",
    docNum: "25896314",
    position: "Vendedor",
    salary: 1750,
    status: true,
    addedAt: ISODate()
  }
])

// ======================================================
// COLECCIÓN: PRODUCTS
// ======================================================

db.products.insertMany([
  {
    name: "Vino Tinto Reserva",
    category: "Vino",
    stock: 120,
    unitPrice: NumberDecimal("65.50"),
    volumeMl: 750,
    alcoholPercentage: 13.5,
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Vino Rose Premium",
    category: "Vino",
    stock: 80,
    unitPrice: NumberDecimal("55.00"),
    volumeMl: 750,
    alcoholPercentage: 12.5,
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Vino Blanco Seco",
    category: "Vino",
    stock: 60,
    unitPrice: NumberDecimal("50.00"),
    volumeMl: 750,
    alcoholPercentage: 11.5,
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Vino Gran Reserva",
    category: "Vino",
    stock: 50,
    unitPrice: NumberDecimal("85.00"),
    volumeMl: 750,
    alcoholPercentage: 14.5,
    status: false,
    addedAt: ISODate()
  },
  {
    name: "Vino Espumante",
    category: "Vino",
    stock: 70,
    unitPrice: NumberDecimal("60.00"),
    volumeMl: 750,
    alcoholPercentage: 12.0,
    status: false,
    addedAt: ISODate()
  }
])

// ======================================================
// COLECCIÓN: LOCATIONS
// ======================================================

db.locations.insertMany([
  {
    name: "Bodega Principal",
    type: "Bodega",
    address: "Lunahuaná, Lima",
    coordinates: {
      lat: -12.97,
      lng: -76.15
    }
  },
  {
    name: "Almacen Central",
    type: "Almacen",
    address: "Cañete, Lima",
    coordinates: {
      lat: -13.05,
      lng: -76.38
    }
  }
])

// ======================================================
// COLECCIÓN: SUPPLIER
// ======================================================

db.supplier.insertMany([
  {
    businessName: "Vidrios Andinos SAC",
    phone: "987123654",
    email: "ventas@vidriosandinos.com",
    location: "Cañete",
    status: true,
    addedAt: ISODate()
  },
  {
    businessName: "Corchos del Sur SAC",
    phone: "998321654",
    email: "contacto@corchosdelsur.com",
    location: "Ica",
    status: true,
    addedAt: ISODate()
  }
])

// ======================================================
// COLECCIÓN: SUPPLIES
// ======================================================

db.supplies.insertMany([
  {
    name: "Botella de vidrio 750ml",
    category: "Envases",
    unit: "Unidad",
    unitPrice: NumberDecimal("2.50"),
    stock: 500,
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Corchos naturales",
    category: "Insumos",
    unit: "Unidad",
    unitPrice: NumberDecimal("0.80"),
    stock: 600,
    status: true,
    addedAt: ISODate()
  }
])

// ======================================================
// COLECCIÓN: PAYMENT METHOD
// ======================================================

db.payment_method.insertMany([
  {
    name: "Efectivo",
    description: "Pago en efectivo",
    extraCharges: 0,
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Tarjeta de credito",
    description: "Pago con Visa o Mastercard",
    extraCharges: 2.5,
    status: true,
    addedAt: ISODate()
  },
  {
    name: "Yape",
    description: "Pago mediante billetera digital",
    extraCharges: 0,
    status: true,
    addedAt: ISODate()
  }
])

// ======================================================
// VARIABLES DE REFERENCIA
// ======================================================

const clientCarlos = db.client.findOne({ docNum: "45678912" })
const employeeLuis = db.employee.findOne({ docNum: "74125896" })
const paymentCash = db.payment_method.findOne({ name: "Efectivo" })
const productReserva = db.products.findOne({ name: "Vino Tinto Reserva" })

// ======================================================
// COLECCIÓN: SALE
// ======================================================

db.sale.insertMany([
  {
    client: {
      clientId: clientCarlos._id,
      name: clientCarlos.name,
      surname: clientCarlos.surname,
      docType: clientCarlos.docType,
      docNum: clientCarlos.docNum
    },

    employee: {
      employeeId: employeeLuis._id,
      name: employeeLuis.name,
      surname: employeeLuis.surname,
      position: employeeLuis.position
    },

    paymentMethod: {
      paymentMethodId: paymentCash._id,
      name: paymentCash.name,
      extraCharges: paymentCash.extraCharges
    },

    saleDate: ISODate("2026-03-10"),
    status: true,

    products: [
      {
        productId: productReserva._id,
        name: productReserva.name,
        quantity: 2,
        unitPrice: productReserva.unitPrice,
        subtotal: NumberDecimal("131.00")
      }
    ],

    total: NumberDecimal("131.00")
  },

  {
    client: {
      clientId: clientCarlos._id,
      name: clientCarlos.name,
      surname: clientCarlos.surname,
      docType: clientCarlos.docType,
      docNum: clientCarlos.docNum
    },

    employee: {
      employeeId: employeeLuis._id,
      name: employeeLuis.name,
      surname: employeeLuis.surname,
      position: employeeLuis.position
    },

    paymentMethod: {
      paymentMethodId: paymentCash._id,
      name: paymentCash.name,
      extraCharges: paymentCash.extraCharges
    },

    saleDate: ISODate("2026-03-12"),
    status: true,

    products: [
      {
        productId: productReserva._id,
        name: productReserva.name,
        quantity: 1,
        unitPrice: productReserva.unitPrice,
        subtotal: NumberDecimal("65.50")
      }
    ],

    total: NumberDecimal("65.50")
  }
])

// ======================================================
// COLECCIÓN: PURCHASES
// ======================================================

db.purchases.insertMany([
  {
    supplierName: "Vidrios Andinos SAC",
    date: ISODate(),
    status: true,

    supplies: [
      {
        name: "Botella de vidrio 750ml",
        quantity: 200,
        unitPrice: NumberDecimal("2.50")
      }
    ],

    total: NumberDecimal("500.00")
  },

  {
    supplierName: "Corchos del Sur SAC",
    date: ISODate(),
    status: true,

    supplies: [
      {
        name: "Corchos naturales",
        quantity: 300,
        unitPrice: NumberDecimal("0.80")
      }
    ],

    total: NumberDecimal("240.00")
  }
])

// ======================================================
// COLECCIÓN: SALE ANALYTICS
// ======================================================

db.sale_analytics.insertMany([
  {
    date: "2026-03-10",
    productName: "Vino Tinto Reserva",
    unitsSold: 35,
    revenue: 2275,

    paymentMethods: {
      cash: 15,
      card: 12,
      digitalWallet: 8
    }
  },

  {
    date: "2026-03-11",
    productName: "Vino Rose Premium",
    unitsSold: 22,
    revenue: 1210,

    paymentMethods: {
      cash: 10,
      card: 7,
      digitalWallet: 5
    }
  }
])

// ======================================================
// COLECCIÓN: USER
// ======================================================

db.user.insertMany([
  {
    username: "admin_principal",
    email: "admin@vinum.com",
    password: "hash_password_123",
    role: "ADMIN",
    status: true,
    addedAt: ISODate()
  },

  {
    username: "ventas_admin",
    email: "ventas@vinum.com",
    password: "hash_password_456",
    role: "SALES_MANAGER",
    status: true,
    addedAt: ISODate()
  }
])

// ======================================================
// OPERACIONES CRUD - PRODUCTS
// ======================================================

// CREATE
db.products.insertOne({
  name: "Vino Edicion Especial",
  category: "Vino",
  stock: 40,
  unitPrice: NumberDecimal("95.00"),
  volumeMl: 750,
  alcoholPercentage: 15.0,
  status: true,
  addedAt: ISODate()
})

// READ
db.products.find()

db.products.find({
  name: "Vino Tinto Reserva"
})

db.products.find({
  stock: { $gt: 50 }
})

// UPDATE
db.products.updateOne(
  { name: "Vino Blanco Seco" },
  {
    $set: {
      updatedAt: ISODate()
    },
    $inc: {
      stock: 20
    }
  }
)

// DELETE
db.products.deleteOne({
  name: "Vino Edicion Especial"
})

// ======================================================
// CONSULTAS
// ======================================================

// Productos activos
db.products.find(
  { status: true },
  { name: 1, unitPrice: 1, stock: 1 }
).sort({ name: 1 })

// Cliente por DNI
db.client.find(
  { docNum: "12345678" },
  { name: 1, surname: 1 }
)

// Ventas por fecha
db.sale.find({
  saleDate: {
    $gte: ISODate("2026-01-01")
  }
}).sort({
  saleDate: -1
})

// ======================================================
// AGREGACIONES
// ======================================================

// Productos más vendidos
db.sale.aggregate([
  { $unwind: "$products" },

  {
    $group: {
      _id: "$products.name",
      totalVendidos: {
        $sum: "$products.quantity"
      }
    }
  },

  {
    $sort: {
      totalVendidos: -1
    }
  }
])

// Ventas por empleado
db.sale.aggregate([
  {
    $group: {
      _id: "$employee.name",
      totalVentas: {
        $sum: "$total"
      },
      cantidadVentas: {
        $sum: 1
      }
    }
  },

  {
    $sort: {
      totalVentas: -1
    }
  }
])

// Ingresos por día
db.sale.aggregate([
  {
    $group: {
      _id: {
        year: { $year: "$saleDate" },
        month: { $month: "$saleDate" },
        day: { $dayOfMonth: "$saleDate" }
      },

      totalIngresos: {
        $sum: "$total"
      }
    }
  },

  {
    $sort: {
      "_id.year": 1,
      "_id.month": 1,
      "_id.day": 1
    }
  }
])

// ======================================================
// ÍNDICES
// ======================================================

// Índice para búsqueda rápida de clientes por documento
db.client.createIndex({
  docNum: 1
})

// Índice para filtrado de productos activos
db.products.createIndex({
  status: 1
})

// Índice para ordenamiento y búsquedas por fecha
db.sale.createIndex({
  saleDate: -1
})

// Índice multikey para productos dentro de ventas
db.sale.createIndex({
  "products.productId": 1
})

// ======================================================
// EXPLAIN PLAN
// ======================================================

db.client.find({
  docNum: "45678912"
}).explain("executionStats")