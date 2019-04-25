import Class from "../../lib/Class";

export default Class.create({
    inheritedStatics: {
        '$inject': [],
        inject: function() {
            for (var i = 0; i < arguments.length; i++) this['$inject'].push(arguments[i]);
            return this;
        }
    }
});
