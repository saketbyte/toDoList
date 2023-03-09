// requiring important modules and some basic boilerplate.
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname+"/date.js");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

app.set("view engine", "ejs");

app.use( bodyParser.urlencoded({extended: true,}));
app.use(express.static("public"));
 
// Right way to connect to mongoose.
main().catch(err => console.log(err));
async function main() {await mongoose.connect('mongodb+srv://todolist:t1e2s3t@cluster0.qysqnvn.mongodb.net/test');}
// local link: mongodb://127.0.0.1:27017/todolistDB
// 
 
// Defining a mongoose schema, even a JS object worked.

const itemsSchema = mongoose.Schema({
  name: String,
});

// Creating a default collection for main list
const Item = mongoose.model("Item", itemsSchema);
 
// initialising some variables.
// const  day = date.getDate();  // accessing date from the 

// some default items as a guide to use the app.
const item1 = new Item({name: "Welcome to your To do list",});
const item2 = new Item({name: "Hit the + to your ToDoList",});
const item3 = new Item({name: "<-- hit this to delete an item",});

// storing the defaut items in an array.
const defaultItems = [item1, item2, item3];

// A schema which will contain one list and it's items.
const listSchema = {
  name: String,
  items: [itemsSchema]
}

// A collection which will contain all other lists as documents, except the main list.
 const List = mongoose.model("collectionOfList", listSchema);

// ------------------------ ROUTING STARTS -----------------------------------

// GET Request at Root Route to receive request from website, to respond with rendering of page.
app.get("/", function (req, res) {

  readDB();
  // Note that: Async function will return a promise and not the values. 
  async function readDB(){
    // item.find returns a query as a response of the promise. We can alternatively use then function, but I like this syntax more.
    foundItem = await Item.find({});
    // If it is the first time being used, render with default items.
    if (foundItem.length === 0) 
       Item.insertMany(defaultItems);
       res.render("list", {
        listTitle: "Today", // dont change this name, little hardcode.
        newListItems: foundItem,
      });
   
      }
    
});

// ---------- Dynamic routing -----------
app.get("/:customListName", function(req,res){

  const customListName = _.capitalize(req.params.customListName); // removing case sensitivity etc.

  // this async function finds the custom list if it exists, but if not, it will create a new document for the list.
  listMaker(); 
  async function listMaker(){

    // In mongoose v-7.0 it does not accept any call back, returns a query.
    foundList = await List.findOne({name :customListName}); 

    // If the above function can not find anything, it will return null. 
    // Error: undefined was solved because I was not using it inside asynch function. And call backs are not accepter. Also if I use exec() it will return a promise object, which again needs to be nested with callbacks, which made the code very dirty. So async function is the way to go. You might see me using it a lot.

    if(!foundList){
      // create a new list based on the listSchema we defined above.
        const list = new List ({
        name : customListName,
        items : defaultItems });

        //saving the default items in the list.
        // used then because, it is compact, and self explanatory here. But if multiple lines are there, I'd use async
        // list.save(list).then(() =>console.log("Saved"))
        list.save(list);
        // redirecting to present the updated version immediately.
        res.redirect('/'+customListName);
    
    }
      else{
      // show an existing list
      res.render("list",{listTitle: foundList.name, newListItems: foundList.items})
      }
        
      }

});


// Post request at the root route. 
app.post("/", function(req, res){
  // receiving two values - list name and the item entered by user.
  // List name is needed by us to make sure that we update the correct list in our backend.
  const itemName = req.body.newItem;
  const listName = req.body.list;
 
  // converting the simple itemName into an Item document before inserting in Item collection of Today list.
  const item = new Item ({
    name: itemName
  });

 
  if (listName === "Today") {
   // saving to today list
    item.save();
    res.redirect("/"); 
    
  } else {

// Async function to find, and then push the items in that array of listSchema, which is custom created by user.

  listUpdater();
  async function listUpdater(){
    //finding the list document, it exists because we created it in the get(/:custom route)

    foundList = await List.findOne({name :listName});
    foundList.items.push(item);
    foundList.save() // save and redirect.
      res.redirect("/" + listName);   

        
      }   
       }
  } );


app.post("/delete", function (req, res) {


  let currList = req.body.list; // since, one input can return only one value, we take a hidden input as dummy input to give us the list title in return.
  let  toDelId = req.body.checker; // Gives the id of item checked through  onchange="this.form.submit()" this attribute of form input.

  // deleting from the main default today list.

    listItemDeleter();
    async function listItemDeleter(){
      // find the list, then find in it with mongoDB the specific item, to be deleted with it's id. 
    await List.findOneAndUpdate({name: currList}, {$pull: {items: {_id: toDelId}}});

    if(currList === 'Today')
    {
      delItem(Item)
      async function delItem(collToDelFrom){
        // This function takes an argument which is the corresponding mongoose collection name, based on the list.
    
        // deleting the item, findOneAndDelete something is depricated now.
        await collToDelFrom.deleteOne({_id: toDelId});
      }
    res.redirect('/');
    }
    else
    res.redirect('/'+currList);}

    // Item.findByIdAndDelete({_id: toDelId});
    // res.redirect('/');


});



 
 // About route rendering.
app.get("/about", function (req, res) {
  res.render("about");
});
 // Connecting to server.
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
 