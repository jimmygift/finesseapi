var path = require('path');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');
var buildPath = path.resolve(__dirname, 'dist');
var mainPath = path.resolve(__dirname, 'app', 'app.js');


module.exports = {
    entry: mainPath,
    output: {
        path: buildPath,
        filename: "bundle.js"
    },
    module: {
        loaders: [
	 { test: /\.jsx$/,
           loader: 'babel',
         },
	 { test: /\.js$/,
           exclude: /node_modules/,
           loader: 'babel',
         }
        ]
    },
    resolve: {
       root: path.resolve('./node_modules'),
       extensions:  ['','.js']
    }     
};

