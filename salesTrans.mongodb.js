use("vinum-aw-db")

// ======================================================
// VERIFICACIÓN INICIAL
// ======================================================

print("===== STOCK ANTES DE LA TRANSACCIÓN =====")

db.products.find(
  { name: "Vino Tinto Reserva" },
  { name: 1, stock: 1, unitPrice: 1 }
)

// ======================================================
// INICIAR SESIÓN
// ======================================================

const session = db.getMongo().startSession()

const database =
  session.getDatabase("vinum-aw-db")

try {

  // ==================================================
  // INICIAR TRANSACCIÓN
  // ==================================================

  session.startTransaction()

  print("===== TRANSACCIÓN INICIADA =====")

  // ==================================================
  // OBTENER DATOS MAESTROS
  // ==================================================

  const client =
    database.client.findOne({
      docNum: "45678912",
      status: true
    })

  const employee =
    database.employee.findOne({
      docNum: "74125896",
      status: true
    })

  const paymentMethod =
    database.payment_method.findOne({
      name: "Efectivo",
      status: true
    })

  const product =
    database.products.findOne({
      name: "Vino Tinto Reserva 2",
      status: true
    })

  // ==================================================
  // VALIDACIONES
  // ==================================================

  if(!client){
    throw new Error("Cliente no encontrado")
  }

  if(!employee){
    throw new Error("Empleado no encontrado")
  }

  if(!paymentMethod){
    throw new Error("Método de pago no encontrado")
  }

  if(!product){
    throw new Error("Producto no encontrado")
  }

  const quantity = 200

  if(product.stock < quantity){
    throw new Error("Stock insuficiente")
  }

  // ==================================================
  // CÁLCULOS
  // ==================================================

  const unitPrice =
    parseFloat(product.unitPrice)

  const subtotal =
    quantity * unitPrice

  // ==================================================
  // REGISTRO DE VENTA
  // ==================================================

  database.sale.insertOne({

    client: {
      clientId: client._id,
      name: client.name,
      surname: client.surname,
      docType: client.docType,
      docNum: client.docNum
    },

    employee: {
      employeeId: employee._id,
      name: employee.name,
      surname: employee.surname,
      position: employee.position
    },

    paymentMethod: {
      paymentMethodId: paymentMethod._id,
      name: paymentMethod.name,
      extraCharges: paymentMethod.extraCharges
    },

    saleDate: new Date(),

    status: true,

    products: [
      {
        productId: product._id,
        name: product.name,
        quantity: quantity,
        unitPrice: product.unitPrice,
        subtotal: NumberDecimal(
          subtotal.toFixed(2)
        )
      }
    ],

    total: NumberDecimal(
      subtotal.toFixed(2)
    )

  })

  print("Venta registrada correctamente")

  // ==================================================
  // ACTUALIZAR STOCK
  // ==================================================

  database.products.updateOne(
    {
      _id: product._id
    },
    {
      $inc: {
        stock: -quantity
      },
      $set: {
        updatedAt: new Date()
      }
    }
  )

  print("Stock actualizado correctamente")

  // ==================================================
  // CONFIRMAR TRANSACCIÓN
  // ==================================================

  session.commitTransaction()

  print("✅ COMMIT REALIZADO")

}
catch(error){

  // ==================================================
  // CANCELAR TRANSACCIÓN
  // ==================================================

  session.abortTransaction()

  print("❌ TRANSACCIÓN CANCELADA")
  print("Motivo: " + error.message)

}
finally{

  session.endSession()

}

// ======================================================
// VERIFICACIÓN FINAL
// ======================================================

print("===== STOCK DESPUÉS DE LA TRANSACCIÓN =====")

db.products.find(
  { name: "Vino Tinto Reserva" },
  { name: 1, stock: 1 }
)

print("===== ÚLTIMA VENTA REGISTRADA =====")

db.sale.find()
       .sort({ saleDate: -1 })
       .limit(1)