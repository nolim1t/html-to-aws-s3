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

  var key = directory + file.name;
  var fd = new FormData();
  fd.append('policy', generateCorsPolicy());
  $.ajax({
    type: 'GET',
    url: "https://tlk8yqeq3h.execute-api.us-east-1.amazonaws.com/1/generate-policy?path=" + encodeURIComponent(key) + "&file-type=" + encodeURIComponent(file.type) + '&policystring=' + encodeURIComponent(generateCorsPolicy()),
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
        url: "https://s3.amazonaws.com/incoming.itinerantfoodie.com",
        data: fd,
        type: "POST",
        processData: false,
        contentType: false,
        success: function(uploaddata, uploadstatus, uploadxhr) {
          console.log("Done");
          $("#progressNumber").html("<strong>File uploaded</strong>. It should appear as the following versions: <a href='https://s3.amazonaws.com/incoming.itinerantfoodie.com/" + key + "'>Original</a> or <a href='https://s3.amazonaws.com/images.itinerantfoodie.com/" + key + "'>resized version</a>");
          $('#codearea1').val("[Resized Link](https://s3.amazonaws.com/images.itinerantfoodie.com/" + key + ")");
          $('#codearea2').val("[Resized CDN ink](https://images.itinerantfoodie.com/" + key + ")");
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
