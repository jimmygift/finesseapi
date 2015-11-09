// http://stackoverflow.com/questions/17847618/adding-functionality-for-using-the-up-and-down-arrow-keys-to-select-a-table-row
// http://jsfiddle.net/EYYgT/2/

var calls     = {
  lastCalls:
[{"id":153073,"startTime":1437063814000,"callDuration":7000,"ani":"16698","dnis":"1360"},{"id":152537,"startTime":1437003234000,"callDuration":21000,"ani":"16698","dnis":"811"},{"id":152534,"startTime":1437003217000,"callDuration":14000,"ani":"16698","dnis":"1360"},{"id":151581,"startTime":1436919827000,"callDuration":35000,"ani":"16698","dnis":"1360"},{"id":151314,"startTime":1436908550000,"callDuration":11000,"ani":"10774","dnis":"16698"}]
};

// send on the query string the attribute embedded in the HTML code 
var baseUrl   = '/getLastContacts',
    extension = $('#datastore01').attr('data-extension'),
    data      = { extension: extension,
                  limit: 5},
    queryUrl  = baseUrl + '?' +  $.param(data),
    templateUrl = '/html/tableTemplate.html',
    template = null;

// Get the template source and then get the table data
$.get(templateUrl, function(source){
  template = Handlebars.compile(source);
  getLastCalls();

});


$('.alert-danger').hide();
$('.alert-warning').hide();
$('.alert-success').hide();

//$('#tablePlaceholder').append(template(calls));

function getLastCalls() {
  $.get(queryUrl,function(data){
    $('.table').remove();
    $('#tablePlaceholder').append(template({lastCalls: data}));
    attachEventHandlers();
  });
};


// right padding s with c to a total of n chars
function padding_right(s, c, n) {
  if (! s || ! c || s.length >= n) {
    return s;
  }
  var max = (n - s.length)/c.length;
  for (var i = 0; i < max; i++) {
    s += c;
  }
  return s;
}

function attachEventHandlers() {
    
    /* Get all rows from your 'table' but not the first one 
     * that includes headers. */
    var rows = $('tr').not(':first');
     

    /* Create 'click' event handler for rows */
    rows.on('click', function(e) {
        
      /* Get current row */
      var row = $(this);

      // unselect if previously selected
      if ( row.hasClass('highlight') ) { 
        $("#contactId").text('current call');
        row.removeClass('highlight');

      } else if ((e.ctrlKey || e.metaKey) || e.shiftKey) {
        /* If pressed highlight the other row that was clicked */
        // row.addClass('highlight');
      } else {
        /* Otherwise just highlight one row and clean others */

        rows.removeClass('highlight');
        row.addClass('highlight');
        
        var callId = row.children('td:nth-child(1)').text();
        $("#contactId").html("<strong>"+padding_right(' ' + callId,' ',12 )+"</strong>")  ;

      }
      
    });
    
  /* This 'event' is used just to avoid that the table text 
   * gets selected (just for styling). 
   * For example, when pressing 'Shift' keyboard key and clicking 
   * (without this 'event') the text of the 'table' will be selected.
   * You can remove it if you want, I just tested this in 
   * Chrome v30.0.1599.69 */
  $(document).bind('.table', function(e) { 
    e.preventDefault(); return false; 
  });


  // Submit ticket to server and update UI on response
  $("#submit").click(function(){
    var data = {contactId: $.trim($('#contactId').text()),
                ticketNum: $.trim($('#ticketnumber').val())
               };
    
    $.post('/tickets', $.param(data), function(data, status, jqXHR ){

      if (data.status == 200) {
        $('.alert-success #message').text('Ticket asigned successfully');
        $('.alert-success').show();
        $("#myModal").hide();
        
        $('#ticketnumber').val('');
        // hide the success message after 5 secs
        $('.alert-success').delay(5000).fadeOut();
        getLastCalls();
      }
      console.log(status);
      console.log(data);
    });

    //$("#myModal").modal('show');
  });
};


// Catch arrow up and down key press events
function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
    }
    else if (e.keyCode == '40') {
        // down arrow
    }
    else if (e.keyCode == '37') {
       // left arrow
    }
    else if (e.keyCode == '39') {
       // right arrow
    }

}

$(function() {
  var input = $('input[type=text]');

  input.focus(function() {
    console.log('input field focus');
    $(this).placeholder = '';
    }).blur(function() {
      var el = $(this);

         /* use the elements title attribute to store the 
            default text - or the new HTML5 standard of using
            the 'data-' prefix i.e.: data-default="some default" */
      if(el.val() == '')
        el.val(el.attr('title'));
    });
});





// Run only in the context of Finesse

//console.log('++++++++++++++++++++++');
if (typeof gadgets==='object'){
  console.log('------------------------------------------->   ' + $.fn.jquery + ' ' + typeof $('#submit') );
  //clientLogs.log(' +++++++++++++++++++++++++++++++++++++++');
  // Click event handler for OK (send) button
 
 /*
 $("#submit").on('click',function(e){
    console.log('Submit');
    //alert("submit");
  });
  */

};



