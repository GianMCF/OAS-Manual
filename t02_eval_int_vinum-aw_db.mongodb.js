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

use("vinum-aw-db")


// =====================================================
// LIMPIAR COLECCIONES
// =====================================================

db.client.drop()
db.products.drop()
db.sale.drop()
db.purchases.drop()


// =====================================================
// CONSTANTES Y DATOS BASE
// =====================================================

const names = [ "Carlos", "Lucia", "Miguel", "Andrea", "Fernando", "Valeria", "Jorge", "Camila", "Diego", "Mariana", "Luis", "Patricia", "Jose", "Rosa", "Ricardo", "Daniela", "Kevin", "Sofia", "Alonso", "Paula" ]

const surnames = [ "Ramirez", "Torres", "Fernandez", "Paredes", "Rojas", "Silva", "Castillo", "Diaz", "Vargas", "Lopez", "Garcia", "Sanchez", "Quispe", "Huaman", "Mendoza", "Flores", "Salazar", "Navarro", "Gutierrez", "Chavez" ]

const emailDomains = [ "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "vinum.com", "icloud.com" ]

const wineNames = [ "Vino Tinto Reserva", "Vino Rosé Premium", "Vino Blanco Seco", "Vino Gran Reserva", "Vino Espumante" ]

const suppliers = [ "Vidrios Andinos SAC", "Corchos del Sur SAC", "Distribuidora Cañete SAC" ]

const paymentMethods = [ "Efectivo", "Tarjeta", "Yape" ]


// =====================================================
// COLECCIÓN: CLIENT
// 100 DOCUMENTOS
// =====================================================

for(let i = 1; i <= 100; i++) {

  // Nombre aleatorio
  const randomName =
    names[
      Math.floor(Math.random() * names.length)
    ]

  // Primer apellido aleatorio
  const surname1 =
    surnames[
      Math.floor(Math.random() * surnames.length)
    ]

  // Segundo apellido aleatorio
  const surname2 =
    surnames[
      Math.floor(Math.random() * surnames.length)
    ]

  // Dominio aleatorio
  const domain =
    emailDomains[
      Math.floor(Math.random() * emailDomains.length)
    ]

  // Construcción del correo
  const email =
    randomName.toLowerCase() +
    i +
    "@" +
    domain

  // Inserción del documento
  db.client.insertOne({

    name: randomName,

    surname:
      surname1 + " " + surname2,

    phoneNum:
      "9" +
      Math.floor(
        10000000 + Math.random() * 89999999
      ),

    email: email,

    age:
      Math.floor(Math.random() * 43) + 18,

    docType: "DNI",

    docNum:
      String(
        Math.floor(
          10000000 + Math.random() * 89999999
        )
      ),

    status:
      Math.random() > 0.2,

    addedAt: new Date()

  })

}


// =====================================================
// COLECCIÓN: PRODUCTS
// 100 DOCUMENTOS
// =====================================================

for(let i = 1; i <= 100; i++){

  db.products.insertOne({

    name:
      wineNames[
        Math.floor(Math.random() * wineNames.length)
      ],

    category: "Vino",

    stock:
      Math.floor(Math.random() * 200) + 20,

    unitPrice:
      NumberDecimal(
        (
          Math.random() * 100 + 30
        ).toFixed(2)
      ),

    volumeMl: 750,

    alcoholPercentage:
      Number(
        (
          Math.random() * 4 + 10
        ).toFixed(1)
      ),

    status:
      Math.random() > 0.1,

    createdAt: new Date()

  })

}


// =====================================================
// OBTENER DATOS PARA RELACIONES
// =====================================================

const clients = db.client.find().toArray()

const products = db.products.find().toArray()


// =====================================================
// COLECCIÓN: SALE
// 100 DOCUMENTOS
// =====================================================

for(let i = 1; i <= 100; i++){

  let selectedClient =
    clients[
      Math.floor(Math.random() * clients.length)
    ]

  let selectedProduct =
    products[
      Math.floor(Math.random() * products.length)
    ]

  let quantity =
    Math.floor(Math.random() * 5) + 1

  let subtotal =
    quantity *
    parseFloat(selectedProduct.unitPrice)

  db.sale.insertOne({

    client: {
      clientId: selectedClient._id,
      name: selectedClient.name,
      surname: selectedClient.surname
    },

    employee: {
      name:
        names[
          Math.floor(Math.random() * names.length)
        ],
      position: "Vendedor"
    },

    paymentMethod: {
      name:
        paymentMethods[
          Math.floor(
            Math.random() * paymentMethods.length
          )
        ]
    },

    saleDate: new Date(),

    status: true,

    products: [
      {
        productId: selectedProduct._id,
        name: selectedProduct.name,
        quantity: quantity,
        unitPrice: selectedProduct.unitPrice,
        subtotal:
          NumberDecimal(
            subtotal.toFixed(2)
          )
      }
    ],

    total:
      NumberDecimal(
        subtotal.toFixed(2)
      )

  })

}


// =====================================================
// COLECCIÓN: PURCHASES
// 100 DOCUMENTOS
// =====================================================

for(let i = 1; i <= 100; i++){

  let quantity =
    Math.floor(Math.random() * 300) + 50

  let unitPrice =
    Number(
      (
        Math.random() * 5 + 1
      ).toFixed(2)
    )

  let total =
    quantity * unitPrice

  db.purchases.insertOne({

    supplierName:
      suppliers[
        Math.floor(Math.random() * suppliers.length)
      ],

    purchaseDate: new Date(),

    status: true,

    supplies: [
      {
        name: "Botella de vidrio 750ml",

        quantity: quantity,

        unitPrice:
          NumberDecimal(
            unitPrice.toFixed(2)
          )
      }
    ],

    total:
      NumberDecimal(
        total.toFixed(2)
      )

  })

}


// =====================================================
// VERIFICACIÓN DE DOCUMENTOS
// =====================================================

db.client.countDocuments()
db.products.countDocuments()
db.sale.countDocuments()
db.purchases.countDocuments()

// =====================================================
// CONSULTAS PRINCIPALES
// =====================================================


// ======================================
// CONSULTA 1
// CLIENTE POR DNI
// ======================================

db.client.find(
  {
    docNum: "45678912"
  }
)


// ======================================
// CONSULTA 2
// PRODUCTOS ACTIVOS
// ======================================

db.products.find(
  {
    status: true
  },
  {
    name: 1,
    unitPrice: 1,
    stock: 1
  }
).sort({
  name: 1
})


// ======================================
// CONSULTA 3
// VENTAS POR FECHA
// ======================================

db.sale.find(
  {
    saleDate: {
      $gte: ISODate("2026-01-01")
    }
  }
).sort({
  saleDate: -1
})


// =====================================================
// AGREGACIONES
// =====================================================


// ======================================
// PIPELINE 1
// PRODUCTOS MÁS VENDIDOS
// ======================================

db.sale.aggregate([

  {
    $unwind: "$products"
  },

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


// ======================================
// PIPELINE 2
// VENTAS POR EMPLEADO
// ======================================

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


// ======================================
// PIPELINE 3
// INGRESOS POR DÍA
// ======================================

db.sale.aggregate([

  {
    $group: {

      _id: {

        year: {
          $year: "$saleDate"
        },

        month: {
          $month: "$saleDate"
        },

        day: {
          $dayOfMonth: "$saleDate"
        }

      },

      totalIngresos: {
        $sum: "$total"
      }

    }
  },

  {
    $sort: {
      "_id": 1
    }
  }

])


// =====================================================
// ÍNDICES
// =====================================================


// ======================================
// ÍNDICE 1
// CLIENTES POR DNI
// ======================================

db.client.createIndex({
  docNum: 1
})


// JUSTIFICACIÓN:
// Optimiza búsquedas rápidas de clientes
// por número de documento (DNI).


// ======================================
// ÍNDICE 2
// VENTAS POR FECHA
// ======================================

db.sale.createIndex({
  saleDate: -1
})


// JUSTIFICACIÓN:
// Mejora consultas cronológicas,
// reportes y dashboards.


// ======================================
// ÍNDICE 3
// PRODUCTOS ACTIVOS
// ======================================

db.products.createIndex({
  status: 1
})


// JUSTIFICACIÓN:
// Optimiza la visualización de catálogo
// mostrando únicamente productos activos.


// ======================================
// ÍNDICE MULTIKEY
// PRODUCTOS DENTRO DE VENTAS
// ======================================

db.sale.createIndex({
  "products.productId": 1
})


// JUSTIFICACIÓN:
// Mejora búsquedas y agregaciones sobre
// productos contenidos en arreglos.


// =====================================================
// EXPLAIN - ANÁLISIS DE RENDIMIENTO
// =====================================================


// ======================================
// EXPLAIN CLIENTES
// ======================================

db.client.find({
  docNum: "45678912"
}).explain("executionStats")


// ======================================
// EXPLAIN VENTAS
// ======================================

db.sale.find({

  saleDate: {
    $gte: ISODate("2026-01-01")
  }

}).explain("executionStats")


// =====================================================
// FIN DEL SCRIPT
// =====================================================