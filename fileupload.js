// Helper functions
function ISODateString(d){
 function pad(n){return n<10 ? '0'+n : n}
 return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate())+'T'
      + pad(d.getUTCHours())+':'
      + pad(d.getUTCMinutes())+':'
      + pad(d.getUTCSeconds())+'Z'}

function generateCorsPolicy() {
  // Modify date function
  Date.prototype.addHours = function(h) {
     this.setTime(this.getTime() + (h*60*60*1000));
     return this;
  }

  var thisDate = new Date();
  thisDate = thisDate.addHours(1);
  var corspolicy = JSON.stringify({
    'expiration': ISODateString(thisDate),
    'conditions': [
      {'acl': 'public-read'},
      {'bucket': 'S3BUCKETHERE'},
      ["starts-with", "$Content-Type", ""],
      ["starts-with","$key",""],
      ["content-length-range", 0, 524288000]
    ]
  });
  return btoa(corspolicy);
}

// Upload functions
function uploadFile() {
  var file = document.getElementById('file').files[0];
  var directory = $("#slugtitle").val();
  if (directory == null || directory == undefined || directory == "/") {
    directory = 'uploads/';
  } else {
    directory = 'uploads' + $("#slugtitle").val() + '/';
  }
  if (file == null) {
    return alert("No files selected");
  }
  $("#uploadbutton").attr("disabled", true);

  if (file.type.toString().indexOf("image") == -1) {
    return alert("File must be an image!");
  }


  var key = directory + file.name;
  if (key.indexOf(".JPG") !== -1) key = key.replace(".JPG", ".png"); // Change the extension

  var fd = new FormData();
  fd.append('policy', generateCorsPolicy());
  $.ajax({
    type: 'GET',
    url: "https://APIENDPOINTHERE/1/generate-policy?path=" + encodeURIComponent(key) + "&file-type=" + encodeURIComponent(file.type) + '&policystring=' + encodeURIComponent(generateCorsPolicy()),
    success: function(data, status, xhr) {
      // xhr.responseText
      const jsonResponse = JSON.parse(xhr.responseText);
      fd.append('key', key);
      fd.append('AWSAccessKeyId', jsonResponse["AWSAccessKeyId"]);
      if (jsonResponse["policyencoded"] !== undefined) {
        fd.append('signature', jsonResponse["policyencoded"]);
      } else {
        fd.append('signature', jsonResponse["Signature"]);
      }
      fd.append('acl', jsonResponse["x-amz-acl"]);
      fd.append('Content-Type', file.type);
      fd.append("file",file);

      $("#progressNumber").html("<strong>Uploading...</strong>")
      $.ajax({
        xhr: function() {
          var xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener("progress", function(evt){
            if (evt.lengthComputable) {
              var percentComplete = evt.loaded / evt.total;
              console.log("Loaded: " + evt.loaded.toString());
              console.log("Total: " + evt.total.toString());
              //Do something with upload progress
              console.log(percentComplete);
              $("#progressNumber").html((parseInt(percentComplete * 100)).toString() + "% uploaded");
            }
          }, false);
          // Download
          xhr.addEventListener("progress", function(evt){
            if (evt.lengthComputable) {
              var percentComplete = evt.loaded / evt.total;
              //Do something with download progress
              console.log(percentComplete);
            }
          }, false);
          return xhr;
        },
        url: "https://s3.amazonaws.com/S3BUCKETHERE",
        data: fd,
        type: "POST",
        processData: false,
        contentType: false,
        success: function(uploaddata, uploadstatus, uploadxhr) {
          console.log("Done");
          $("#progressNumber").html("<strong>File uploaded successfully!</strong>");
          $('#codearea1').val("[Resized Link](https://s3.amazonaws.com/S3BUCKETHERE/" + key + ")");
          $('#codearea2').val("[Resized CDN ink](https://S3BUCKETHERE/" + key + ")");
          $("#uploadbutton").attr("disabled", false);
        },
        error: function(uploadXHR, uploadStatus, uploaderror) {
          console.log("Upload Error");
          console.log(uploadStatus);
          console.log(uploadXHR.responseText);
          $("#progressNumber").html("<strong>Error uploading the file</strong>");
          $("#uploadbutton").attr("disabled", false);
        }
      });

    },
    error: function(jqXHR, status, error) {
      console.log("Error");
      console.log(jqXHR);
      console.log(jqXHR.statusCode());
      console.log(status);
      $("#progressNumber").html("<strong>Error calling signing function</strong>");
      $("#uploadbutton").attr("disabled", false);
    }
  });
}
