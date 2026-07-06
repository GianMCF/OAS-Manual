// =====================================================
// BASE DE DATOS: VINUM AW
// IMPLEMENTACIÓN MONGODB ATLAS
// COLECCIONES PRINCIPALES:
// - CLIENT
// - PRODUCTS
// - SALE
// - PURCHASES
// TOTAL: 100 DOCUMENTOS
// =====================================================

// =====================================================
// CREAR Y USAR BASE DE DATOS
// =====================================================

use("vinum-aw-db");

// =====================================================
// LIMPIAR COLECCIONES
// =====================================================

db.client.drop();
db.products.drop();
db.sale.drop();
db.purchases.drop();

// =====================================================
// CONSTANTES Y DATOS BASE
// =====================================================

const names = [
  "Carlos",
  "Lucia",
  "Miguel",
  "Andrea",
  "Fernando",
  "Valeria",
  "Jorge",
  "Camila",
  "Diego",
  "Mariana",
  "Luis",
  "Patricia",
  "Jose",
  "Rosa",
  "Ricardo",
  "Daniela",
  "Kevin",
  "Sofia",
  "Alonso",
  "Paula",
];

const surnames = [
  "Ramirez",
  "Torres",
  "Fernandez",
  "Paredes",
  "Rojas",
  "Silva",
  "Castillo",
  "Diaz",
  "Vargas",
  "Lopez",
  "Garcia",
  "Sanchez",
  "Quispe",
  "Huaman",
  "Mendoza",
  "Flores",
  "Salazar",
  "Navarro",
  "Gutierrez",
  "Chavez",
];

const emailDomains = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "vinum.com",
  "icloud.com",
];

const positions = [
  "Administrador",
  "Jefe Comercial",
  "Supervisor de Ventas",
  "Vendedor",
  "Asistente de Ventas",
  "Encargado de Almacén",
  "Logística",
  "Atención al Cliente",
];

const salaries = {
  Administrador: 3500,
  "Jefe Comercial": 4200,
  "Supervisor de Ventas": 3000,
  Vendedor: 1800,
  "Asistente de Ventas": 1500,
  "Encargado de Almacén": 1900,
  Logística: 2200,
  "Atención al Cliente": 1600,
};

const wineNames = [
  "Vino Tinto Reserva",
  "Vino Rosé Premium",
  "Vino Blanco Seco",
  "Vino Gran Reserva",
  "Vino Espumante",
];

const wineries = [
  "Tabernero",
  "Tacama",
  "Santiago Queirolo",
  "Intipalka",
  "Viñas de Oro",
  "La Caravedo",
  "Don Santiago",
  "Bodega San Nicolás",
];

const wineTypes = ["Tinto", "Blanco", "Rosado", "Espumante"];

const grapeVarieties = [
  "Malbec",
  "Cabernet Sauvignon",
  "Merlot",
  "Syrah",
  "Chardonnay",
  "Sauvignon Blanc",
  "Quebranta",
  "Italia",
  "Torontel",
  "Moscatel",
];

const productLines = [
  "Reserva",
  "Gran Reserva",
  "Premium",
  "Selección Especial",
  "Colección",
  "Estate",
  "Clásico",
  "Edición Limitada",
];

const piscoTypes = [
  "Pisco Quebranta",
  "Pisco Italia",
  "Pisco Torontel",
  "Pisco Acholado",
  "Pisco Mosto Verde",
];

const bottleSizes = [375, 500, 750, 1000];

const suppliers = [
  "Vidrios Andinos SAC",
  "Corchos del Sur SAC",
  "Distribuidora Cañete SAC",
];

// =====================================================
// COLECCIÓN: CLIENT
// 100 DOCUMENTOS
// =====================================================

for (let i = 1; i <= 100; i++) {
  // Nombre aleatorio
  const randomName = names[Math.floor(Math.random() * names.length)];

  // Primer apellido aleatorio
  const surname1 = surnames[Math.floor(Math.random() * surnames.length)];

  // Segundo apellido aleatorio
  const surname2 = surnames[Math.floor(Math.random() * surnames.length)];

  // Dominio aleatorio
  const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];

  // Construcción del correo
  const email = randomName.toLowerCase() + i + "@" + domain;

  // Inserción del documento
  db.client.insertOne({
    name: randomName,

    surname: surname1 + " " + surname2,

    phoneNum: "9" + Math.floor(10000000 + Math.random() * 89999999),

    email: email,

    age: Math.floor(Math.random() * 43) + 18,

    docType: "DNI",

    docNum: String(Math.floor(10000000 + Math.random() * 89999999)),

    status: Math.random() > 0.2,

    addedAt: new Date(),
  });
}

// =====================================================
// COLECCIÓN: CLIENT
// 30 DOCUMENTOS
// =====================================================

for (let i = 1; i <= 30; i++) {
  const name = names[Math.floor(Math.random() * names.length)];

  const surname1 = surnames[Math.floor(Math.random() * surnames.length)];

  const surname2 = surnames[Math.floor(Math.random() * surnames.length)];

  const position = positions[Math.floor(Math.random() * positions.length)];

  const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];

  db.employee.insertOne({
    name: name,

    surname: surname1 + " " + surname2,

    phoneNum: "9" + Math.floor(10000000 + Math.random() * 89999999),

    email: name.toLowerCase() + "." + i + "@" + domain,

    age: Math.floor(Math.random() * 30) + 22,

    docType: "DNI",

    docNum: String(Math.floor(10000000 + Math.random() * 89999999)),

    position: position,

    salary: salaries[position],

    status: true,

    addedAt: new Date(),
  });
}

// =====================================================
// COLECCIÓN: PRODUCTS
// 100 DOCUMENTOS
// =====================================================

for (let i = 1; i <= 100; i++) {
  const isWine = Math.random() > 0.3;

  let productName;
  let category;
  let alcoholPercentage;

  if (isWine) {
    const winery = wineries[Math.floor(Math.random() * wineries.length)];

    const type = wineTypes[Math.floor(Math.random() * wineTypes.length)];

    const grape =
      grapeVarieties[Math.floor(Math.random() * grapeVarieties.length)];

    const line = productLines[Math.floor(Math.random() * productLines.length)];

    productName = winery + " " + type + " " + grape + " " + line;

    category = "Vino";

    alcoholPercentage = Number((Math.random() * 4 + 11).toFixed(1));
  } else {
    const winery = wineries[Math.floor(Math.random() * wineries.length)];

    const pisco = piscoTypes[Math.floor(Math.random() * piscoTypes.length)];

    productName = winery + " " + pisco;

    category = "Pisco";

    alcoholPercentage = Number((Math.random() * 5 + 38).toFixed(1));
  }

  db.products.insertOne({
    name: productName,

    category: category,

    stock: Math.floor(Math.random() * 250) + 20,

    unitPrice: NumberDecimal((Math.random() * 120 + 35).toFixed(2)),

    volumeMl: bottleSizes[Math.floor(Math.random() * bottleSizes.length)],

    alcoholPercentage: alcoholPercentage,

    status: Math.random() > 0.1,

    addedAt: new Date(),
  });
}

// =====================================================
// OBTENER DATOS PARA RELACIONES
// =====================================================

const clients = db.client.find({ status: true }).toArray();

const employees = db.employee.find({ status: true }).toArray();

const products = db.products.find({ status: true }).toArray();

const paymentMethods = db.payment_method.find({ status: true }).toArray();

// =====================================================
// COLECCIÓN: SALE
// 100 DOCUMENTOS
// =====================================================

for (let i = 1; i <= 100; i++) {
  const client = clients[Math.floor(Math.random() * clients.length)];

  const employee = employees[Math.floor(Math.random() * employees.length)];

  const paymentMethod =
    paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

  const productCount = Math.floor(Math.random() * 4) + 1;

  const saleProducts = [];

  let total = 0;

  for (let j = 0; j < productCount; j++) {
    const product = products[Math.floor(Math.random() * products.length)];

    const quantity = Math.floor(Math.random() * 4) + 1;

    const unitPrice = parseFloat(product.unitPrice);

    const subtotal = quantity * unitPrice;

    total += subtotal;

    saleProducts.push({
      productId: product._id,

      name: product.name,

      category: product.category,

      quantity: quantity,

      unitPrice: product.unitPrice,

      subtotal: NumberDecimal(subtotal.toFixed(2)),
    });

    // ======================================
    // DESCONTAR STOCK
    // ======================================

    db.products.updateOne(
      {
        _id: product._id,
      },
      {
        $inc: {
          stock: -quantity,
        },
      },
    );

    // Actualizar stock local
    product.stock -= quantity;
  }

  const randomDays = Math.floor(Math.random() * 180);

  const saleDate = new Date();

  saleDate.setDate(saleDate.getDate() - randomDays);

  db.sale.insertOne({
    client: {
      clientId: client._id,
      name: client.name,
      surname: client.surname,
      docNum: client.docNum,
    },

    employee: {
      employeeId: employee._id,
      name: employee.name,
      surname: employee.surname,
      position: employee.position,
    },

    paymentMethod: {
      paymentMethodId: paymentMethod._id,
      name: paymentMethod.name,
      extraCharges: paymentMethod.extraCharges,
    },

    saleDate: saleDate,

    status: true,

    products: saleProducts,

    total: NumberDecimal(total.toFixed(2)),
  });
}

// =====================================================
// COLECCIÓN: PURCHASES
// 100 DOCUMENTOS
// =====================================================

let purchases = [];

for (let i = 1; i <= 100; i++) {
  const quantity1 = Math.floor(Math.random() * 10) + 1;
  const unitPrice1 = Number((Math.random() * 100 + 10).toFixed(2));
  const subtotal1 = Number((quantity1 * unitPrice1).toFixed(2));

  const quantity2 = Math.floor(Math.random() * 10) + 1;
  const unitPrice2 = Number((Math.random() * 100 + 10).toFixed(2));
  const subtotal2 = Number((quantity2 * unitPrice2).toFixed(2));

  purchases.push({
    total: Number((subtotal1 + subtotal2).toFixed(2)),
    suppliersId: i,
    status: true,
    createdAt: new Date(),
    updatedAt: null,
    deletedAt: null,
    restoredAt: null,
    details: [
      {
        supplyId: i,
        quantity: quantity1,
        unitPrice: unitPrice1,
        subtotal: subtotal1,
      },
      {
        supplyId: i + 100,
        quantity: quantity2,
        unitPrice: unitPrice2,
        subtotal: subtotal2,
      },
    ],
  });
}

db.purchases.insertMany(purchases);

db.purchases.createIndex({ suppliersId: 1 });
db.purchases.createIndex({ status: 1, total: 1 });

db.purchases.countDocuments();
db.purchases.find().limit(5).pretty();
db.purchases.getIndexes();

// =====================================================
// VERIFICACIÓN DE DOCUMENTOS
// =====================================================

db.client.countDocuments();
db.products.countDocuments();
db.sale.countDocuments();
db.purchases.countDocuments();

// =====================================================
// CONSULTAS PRINCIPALES
// =====================================================

// ======================================
// CONSULTA 1
// CLIENTE POR DNI
// ======================================

db.client.find({
  docNum: "45678912",
});

// ======================================
// CONSULTA 2
// PRODUCTOS ACTIVOS
// ======================================

db.products
  .find(
    {
      status: true,
    },
    {
      name: 1,
      unitPrice: 1,
      stock: 1,
    },
  )
  .sort({
    name: 1,
  });

// ======================================
// CONSULTA 3
// VENTAS POR FECHA
// ======================================

db.sale
  .find({
    saleDate: {
      $gte: ISODate("2026-01-01"),
    },
  })
  .sort({
    saleDate: -1,
  });

// =====================================================
// AGREGACIONES
// =====================================================

// ======================================
// PIPELINE 1
// PRODUCTOS MÁS VENDIDOS
// ======================================

db.sale.aggregate([
  {
    $unwind: "$products",
  },

  {
    $group: {
      _id: "$products.name",

      totalVendidos: {
        $sum: "$products.quantity",
      },
    },
  },

  {
    $sort: {
      totalVendidos: -1,
    },
  },
]);

// ======================================
// PIPELINE 2
// VENTAS POR EMPLEADO
// ======================================

db.sale.aggregate([
  {
    $group: {
      _id: "$employee.name",

      totalVentas: {
        $sum: "$total",
      },

      cantidadVentas: {
        $sum: 1,
      },
    },
  },

  {
    $sort: {
      totalVentas: -1,
    },
  },
]);

// ======================================
// PIPELINE 3
// INGRESOS POR DÍA
// ======================================

db.sale.aggregate([
  {
    $group: {
      _id: {
        year: {
          $year: "$saleDate",
        },

        month: {
          $month: "$saleDate",
        },

        day: {
          $dayOfMonth: "$saleDate",
        },
      },

      totalIngresos: {
        $sum: "$total",
      },
    },
  },

  {
    $sort: {
      _id: 1,
    },
  },
]);

// =====================================================
// ÍNDICES
// =====================================================

// ======================================
// ÍNDICE 1
// CLIENTES POR DNI
// ======================================

db.client.createIndex({
  docNum: 1,
});

// JUSTIFICACIÓN:
// Optimiza búsquedas rápidas de clientes
// por número de documento (DNI).

// ======================================
// ÍNDICE 2
// VENTAS POR FECHA
// ======================================

db.sale.createIndex({
  saleDate: -1,
});

// JUSTIFICACIÓN:
// Mejora consultas cronológicas,
// reportes y dashboards.

// ======================================
// ÍNDICE 3
// PRODUCTOS ACTIVOS
// ======================================

db.products.createIndex({
  status: 1,
});

// JUSTIFICACIÓN:
// Optimiza la visualización de catálogo
// mostrando únicamente productos activos.

// ======================================
// ÍNDICE MULTIKEY
// PRODUCTOS DENTRO DE VENTAS
// ======================================

db.sale.createIndex({
  "products.productId": 1,
});

// JUSTIFICACIÓN:
// Mejora búsquedas y agregaciones sobre
// productos contenidos en arreglos.

// =====================================================
// EXPLAIN - ANÁLISIS DE RENDIMIENTO
// =====================================================

// ======================================
// EXPLAIN CLIENTES
// ======================================

db.client
  .find({
    docNum: "45678912",
  })
  .explain("executionStats");

// ======================================
// EXPLAIN VENTAS
// ======================================

db.sale
  .find({
    saleDate: {
      $gte: ISODate("2026-01-01"),
    },
  })
  .explain("executionStats");

// =====================================================
// FIN DEL SCRIPT
// =====================================================
