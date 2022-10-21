const express = require('express');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/todolistDB');

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({ name: 'Welcome to your todolist!' });
const item2 = new Item({ name: 'Hit the + button to add a new item.' });
const item3 = new Item({ name: '<-- Hit this to delete an item.' });

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});
const List = mongoose.model('List', listSchema);

app.get('/', function (req, res) {
  Item.find({}, (err, items) => {
    if (err) {
      console.log(err);
    } else {
      if (items.length === 0) {
        Item.insertMany(defaultItems, (error) => {
          if (error) {
            console.log(error);
          } else {
            console.log('Successfully saved default items to DB');
          }
        });
        res.redirect('/');
      } else {
        res.render('list', { listTitle: 'Today', newListItems: items });
      }
    }
  });
});

app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, results) => {
    if (err) {
      console.log(err);
    } else {
      if (results === null) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.render('list', {
          listTitle: list.name,
          newListItems: list.items,
        });
      } else {
        res.render('list', {
          listTitle: results.name,
          newListItems: results.items,
        });
      }
    }
  });

  // res.render('list', { listTitle: list.name, newListItems: list.items });
});

app.post('/', async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === 'Today') {
    await item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect(`/${listName}`);
    });
  }
});

app.post('/delete', function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, function (error) {
      if (error) console.log(error);
      else console.log('Successfully deleted');
    });
    res.redirect('/');
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.get('/about', function (req, res) {
  res.render('about');
});

app.listen(3000, function () {
  console.log('Server started on port 3000');
});
