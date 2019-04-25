import Class from "../../lib/Class";

export default Class.extend('Language', {
    'id': '',
    'title': '',
    'rtl': 0,
    'quantity': '',

    constructor: function(data) {
        this['id'] = data['id'] || data['idLanguage'];
        this['title'] = data['title'] || data['name'];
        this['rtl'] = data['rtl'];
        this['quantity'] = data['quantity'] || data['bookCount'];
    }
});
