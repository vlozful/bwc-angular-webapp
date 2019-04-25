import Class from "../../lib/Class";

export default Class.extend('Genre', {
    'id': '',
    'title': '',
    'quantity': '',

    constructor: function(data) {
        this['id'] = data['id'] || data['idGenre'];
        this['title'] = data['title'] || data['name'];
        this['quantity'] = data['quantity'] || data['bookCount'];
    }
});

