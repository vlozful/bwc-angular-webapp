import Class from "../../lib/Class";
import BookModel from "./Book";

function parseAndRound(str) {
  return Math.round(parseFloat(str) * 100) / 100 || 0;
}

export default Class.create('CartItem', {
  'id': '',
  'variation': '',
  'currency': '',
  'VAT': '',
  'price': '',
  'qty': '',
  'book': '',

  constructor: function(data) {
    if (angular.isObject(data)) {
      this['id'] = data['id'] || data['idCartsItems'];
      this['variation'] = data['variation'] || data['idProductsVariations'];
      this['currency'] = data['currency'] || data['currencyDesignationConverted'];
      this['price'] = parseAndRound(data['priceConverted']);
      this['VAT'] = parseAndRound(data['VATConverted']);
      this['qty'] = parseInt(data['qty'], 10) || -1;
      this['book'] = new BookModel(data['book']);
    }
  }
});