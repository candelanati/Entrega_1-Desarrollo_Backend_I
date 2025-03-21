const {Router} = require("express")

const { ProductsManager }=require("../dao/productsManager.js")
// const { renderProducts } = require("../utilities/listaDesactualizada.js")
const productManager = new ProductsManager("./src/data/products.json")

const router = Router()

router.get("/", async(req,res)=>{
	let products=await productManager.getProducts()
    req.io.emit("ProductosGet", products)
    //console.log(products)
	//limit
    let {limit}=req.query
    if(limit){
        limit=Number(limit)
        if(isNaN(limit)){
            return res.send("Error: ingrese un limit numérico")
        }
        products=products.slice(0, limit)
    }
	res.status(200).json(products)
})

router.get("/:pid",async(req,res)=>{
    let products=await productManager.getProducts()
    
    let {pid}=req.params
    //validacion
    let producto=products.find(p=>p.id==pid)
    if(!producto){
        return res.status(404).send({error:'no existen productos con id: '+pid})
    }
    req.io.emit("Product", producto)
    res.status(200).json(producto)
})

router.post("/",  async(req,res)=>{
     try{ 
        let productosExistentes = await productManager.getProducts()
        console.log(req.body)
        
        const productoRecibido={
            title:req.body.title,
            description: req.body.description,
            code: req.body.code,
            price: Number(req.body.price),
            status: req.body.status === 'true' || req.body.status === true, 
            stock: Number(req.body.stock),
            category: req.body.category,
            thumbnails:  req.body.thumbnails
        }
        //validaciones
            //pre-existencias
            if(productosExistentes.some(existente => 
                existente.title == productoRecibido.title &&
                existente.description == productoRecibido.description &&
                existente.code == productoRecibido.code &&
                existente.price == productoRecibido.price &&
                existente.status == productoRecibido.status &&
                existente.stock == productoRecibido.stock &&
                existente.category == productoRecibido.category &&
                JSON.stringify(existente.thumbnails) === JSON.stringify(productoRecibido.thumbnails)
            )){
                return res.status(400).send({error:'el producto ya existe en la lista de productos'})
            }else{
                //pre existencia del código
                if(productosExistentes.some(existente =>existente.code == productoRecibido.code)){
                    return res.status(400).send({error:'ya existe un producto con el código: '+productoRecibido.code})
                }
            }
            //completar keys
            if(!productoRecibido.title){
                res.setHeader('Content-Type','application/json')
                return res.status(400).send({error:"complete title"})
            }
            if(!productoRecibido.description){
                res.setHeader('Content-Type','application/json')
                return res.status(400).send({error:"complete description"})
            }
            if(!productoRecibido.code){
                res.setHeader('Content-Type','application/json')
                return res.status(400).send({error:"complete code"})
            }
            if(!productoRecibido.price){
                res.setHeader('Content-Type','application/json')
                return res.status(400).send({error:"complete price"})
            }
            if(!productoRecibido.status){
                res.setHeader('Content-Type','application/json')
                return res.status(400).send({error:"complete status"})
            }
            if(!productoRecibido.stock){
                res.setHeader('Content-Type','application/json')
                return res.status(400).send({error:"complete stock"})
            }
            if(!productoRecibido.category){
                res.setHeader('Content-Type','application/json')
                return res.status(400).send({error:"complete category"})
            }
             if(!productoRecibido.thumbnails){
                 res.setHeader('Content-Type','application/json')
                 return res.status(400).send({error:"complete thumbnails"})
             }

            //tipos
            if (typeof productoRecibido.title !== "string" || !productoRecibido.title.trim()) {
                return res.status(400).send({ error: "El título debe ser un string no vacío" })
            }
            if (typeof productoRecibido.description !== "string" || !productoRecibido.description.trim()) {
                return res.status(400).send({ error: "la descripcion debe ser un string no vacío" })
            }
            if (typeof req.body.code !== "number" || isNaN(req.body.code) || productoRecibido.code <= 0) {
                return res.status(400).send({ error: "El codigo debe ser un número mayor a 0" });
            }
            if (typeof req.body.price !== "number" || isNaN(req.body.price) || productoRecibido.price < 0) {
                return res.status(400).send({ error: "El precio debe ser un número mayor o igual a 0" });
            }
            if (typeof productoRecibido.status !== "boolean") {
                return res.status(400).send({ error: "El estado debe ser un booleano (true o false)" })
            }
            if (typeof req.body.stock !== "number" || isNaN(req.body.stock) || productoRecibido.stock < 0) {
                return res.status(400).send({ error: "El stock debe ser un número mayor o igual a 0" });
            }
            if (typeof productoRecibido.category !== "string" || !productoRecibido.category.trim()) {
                return res.status(400).send({ error: "La categoria debe ser un string no vacío" })
            }
            if(!Array.isArray(productoRecibido.thumbnails)){
                return res.status(400).send({ error: "Las thumbnails deben ser un array de strings" })
            }else{
                if (productoRecibido.thumbnails&&!productoRecibido.thumbnails.every(el => typeof el === "string")) {
                    return res.status(400).send({ error: "Las thumbnails deben ser un array de strings"})
                }
            }
           
        let productoNuevo = await productManager.addProduct(productoRecibido.title,productoRecibido.description,productoRecibido.code,productoRecibido.price,productoRecibido.status,productoRecibido.stock,productoRecibido.category,productoRecibido.thumbnails)
        
        let products=await productManager.getProducts()
        req.io.emit("ProductosGet", products)
        res.status(201).json(productoNuevo)
     }catch (error){
        res.status(500).send({error:'Error en el servidor: '+error})
     }
})

router.put("/:pid", async(req,res)=>{
    try{
        const {pid}=req.params
        let products = await productManager.getProducts()
        let position = products.findIndex(product=>product.id===Number(pid))
        //validacion existencia
        if(position===-1){
            return res.status(400).send('El producto a actualizar con id '+pid+' no existe')
        }
        //validacion existencia de valores a actualizar
        const updatedData = req.body
        console.log('Datos enviados por el body:')
        console.log(updatedData)
        if(!updatedData||Object.keys(updatedData).length===0){
            return res.status(400).send('Debe enviar un valor para actualizar')
        }

        //validaciones valores y tipos
        const productoRecibido={
            title:req.body.title,
            description: req.body.description,
            code: req.body.code,
            price: Number(req.body.price),
            status: req.body.status === 'true' || req.body.status === true, 
            stock: Number(req.body.stock),
            category: req.body.category,
            thumbnails:  req.body.thumbnails
        }
        if (productoRecibido.title&&typeof productoRecibido.title !== "string" || productoRecibido.title&&!productoRecibido.title.trim()) {
            return res.status(400).send({ error: "El título debe ser un string no vacío" })
        }
        if (productoRecibido.description&&typeof productoRecibido.description !== "string" || productoRecibido.description&&!productoRecibido.description.trim()) {
            return res.status(400).send({ error: "la descripcion debe ser un string no vacío" })
        }
        if (productoRecibido.code&&typeof productoRecibido.code !== "number" ) {
            return res.status(400).send({ error: "El codigo debe ser un numero" })
        }
        if (req.body.price !== undefined) { 
            if (typeof req.body.price !== "number" || isNaN(req.body.price) || req.body.price <= 0) {
                return res.status(400).send({ error: "El precio debe ser un número mayor a 0" });
            }
        }
        if (productoRecibido.status&&typeof productoRecibido.status !== "boolean") {
            return res.status(400).send({ error: "El estado debe ser un booleano (true o false)" })
        }
        if (req.body.stock !== undefined) { 
            if (typeof req.body.stock !== "number" || isNaN(req.body.stock) || req.body.stock < 0) {
                return res.status(400).send({ error: "El stock debe ser un número mayor o igual a 0" });
            }
        }
        if (productoRecibido.category&&typeof productoRecibido.category !== "string" || productoRecibido.category&&!productoRecibido.category.trim()) {
            return res.status(400).send({ error: "La categoria debe ser un string no vacío" })
        }
        if(productoRecibido.thumbnails&&!Array.isArray(productoRecibido.thumbnails)){
            return res.status(400).send({ error: "Las thumbnails deben ser un array de strings" })
        }else{
            if (productoRecibido.thumbnails&&!productoRecibido.thumbnails.every(el => typeof el === "string")) {
                return res.status(400).send({ error: "Las thumbnails deben ser un array de strings"})
            }
        }

        const productoActualizado = await productManager.updateProduct(pid,updatedData)
        products=await productManager.getProducts()
        req.io.emit("ProductosGet", products)
        res.status(200).json(productoActualizado)
    }catch(error){
        res.status(500).send({error:'Error en el servidor: '+error})
    }
})

router.delete("/:pid", async(req,res)=>{
    try{
        const {pid} = req.params
        const products = await productManager.getProducts()
        //validacion existencia
        if(!products.find(product=>product.id===Number(pid))){
            res.status(400).send('El producto a eliminar con id '+pid+' no existe')
        }
        let productsEliminado = await productManager.deleteProduct(pid)
        
        req.io.emit("ProductosGet", productsEliminado)
        res.status(200).json(productsEliminado)
    }catch(error){
        res.status(500).send({error:'Error en el servidor: '+error})
    }
})


module.exports=router