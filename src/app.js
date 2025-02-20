const express = require('express')
const { ProductsManager}=require("./dao/productsManager.js")
const {CartManager}=require("./dao/cartManager.js")

const cartManager = new CartManager("./data/cart.json")
const productManager=new ProductsManager("./data/products.json")

const app = express()

const PORT = 8080

//Middlewares para poder trabajar con datos JSON 
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.get("/", (req, res)=>{
    res.setHeader('Content-Type','text/plain')
    res.status(200).send('Home page')
})

app.get("/api/products", async(req,res)=>{
	let products=await productManager.getProducts()
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

app.get("/api/products/:pid",async(req,res)=>{
    let products=await productManager.getProducts()
    let {pid}=req.params
    //validacion
    let producto=products.find(p=>p.id==pid)
    if(!producto){
        return res.status(404).send({error:'no existen productos con id: '+pid})
    }
    res.status(200).json(producto)
})

app.post("/api/products",  async(req,res)=>{
     try{ 
        console.log(req.body)
        const productoRecibido={
            title:req.body.title,
            description: req.body.description,
            code: req.body.code,
            price: Number(req.body.price),
            status: req.body.status === 'true' || req.body.status === true, 
            stock: Number(req.body.stock),
            category: req.body.category,
            thumbnails: JSON.parse(req.body.thumbnails)
        }
        //validaciones
            //existencias
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
            if (typeof productoRecibido.code !== "string" || !productoRecibido.code.trim()) {
                return res.status(400).send({ error: "El codigo debe ser un string no vacío" })
            }
            if (typeof productoRecibido.price !== "number" || productoRecibido.price <= 0) {
                return res.status(400).send({ error: "El precio debe ser un número mayor a 0" })
            }
            if (typeof productoRecibido.status !== "boolean") {
                return res.status(400).send({ error: "El estado debe ser un booleano (true o false)" })
            }
            if (typeof productoRecibido.stock !== "number" || productoRecibido.stock < 0) {
                return res.status(400).send({ error: "El stock debe ser un número mayor o igual a 0" })
            }
            if (typeof productoRecibido.category !== "string" || !productoRecibido.category.trim()) {
                return res.status(400).send({ error: "La categoria debe ser un string no vacío" })
            }
            if (!Array.isArray(productoRecibido.thumbnails) || !productoRecibido.thumbnails.every(el => typeof el === "string")) {
                return res.status(400).send({ error: "Las thumbnails deben ser un array de strings" })
            }
        let productoNuevo = await productManager.addProduct(productoRecibido.title,productoRecibido.description,productoRecibido.code,productoRecibido.price,productoRecibido.status,productoRecibido.stock,productoRecibido.category,productoRecibido.thumbnails)
        res.status(200).json(productoNuevo)
     }catch (error){
        res.status(500).send({error:'Error en el servidor'})
     }
})

app.get("/api/carts", async(req,res)=>{
	let carts=await cartManager.getCart()
    //limit
    let {limit}=req.query
    if(limit){
        limit=Number(limit)
        if(isNaN(limit)){
            return res.send("Error: ingrese un limit numérico")
        }
        carts=carts.slice(0, limit)
    }
	res.status(200).json(carts)
})

app.get("/api/carts/:cid",async(req,res)=>{
    let carts=await cartManager.getCart()
    let {cid}=req.params
    //validacion
    let cart=carts.find(c=>c.id==cid)
    if(!cart){
        return res.status(404).send({error:'no existen carritos con id: '+cid})
    }
    res.status(200).json(cart)
})

app.post("/api/carts",  async(req,res)=>{
    try{ 
        let {products}=req.body
        let productosRecibidosCart=JSON.parse(products)
        let productsExistentes= await productManager.getProducts()
        console.log('\n productos recibidos:')
        console.log(productosRecibidosCart)
        console.log('\n productos existentes:')
        console.log(productsExistentes)
        //validaciones
            //existencias
            let productoNoExistente = productosRecibidosCart.find(recibido => {
                return !productsExistentes.some(existente => 
                    existente.id == recibido.id &&
                    existente.title == recibido.title &&
                    existente.description == recibido.description &&
                    existente.code == recibido.code &&
                    existente.price == recibido.price &&
                    existente.status == recibido.status &&
                    existente.stock == recibido.stock &&
                    existente.category == recibido.category &&
                    JSON.stringify(existente.thumbnails) === JSON.stringify(recibido.thumbnails)
                );
            });
            if (productoNoExistente) {
                return res.status(404).send({
                    error: `El producto: ${productoNoExistente.title} no existe en la lista de productos existentes o no coincide con sus datos`
                });
            }
    
        let productoNuevo = await cartManager.addCart(productosRecibidosCart)
        res.status(200).json(productoNuevo)
    
    
    }catch (error){
       res.status(500).send({error:'Error en el servidor'})
    }
})

//inicializacion del servidor
app.listen(PORT, ()=>{
	console.log('servidor corriendo en el puerto '+PORT)
})