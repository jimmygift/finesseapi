/*
  Get static js and css vendor resources from web server
  i.e.  jQuery, RactJs, CiscoFinesse, etc..
*/

var tarball = require('tarball-extract');

var file_url = "http://11.0.6.60/",
    temp_dir = "/tmp",
    dest_dir = "public",
    file_name = "vendor.tar",
    url = file_url + "/" + file_name,
    tmp = temp_dir + "/" + file_name;

tarball.extractTarballDownload(url , tmp, dest_dir, {}, function(err, result) {
  console.log(err, result)
})
