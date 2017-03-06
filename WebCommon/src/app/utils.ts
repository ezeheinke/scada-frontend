declare var $: any;
declare var d3: any;


export const MonthNames = [
        "January", 
        "February", 
        "March", 
        "April", 
        "May", 
        "June",
        "July", 
        "August", 
        "September", 
        "October", 
        "November", 
        "December"
    ];

export function printDate(date) {
  if (date instanceof Date === false) {
    return "";
  }
	const fmt = x => x < 10 ? `0${x}` : x;

  let year = date.getUTCFullYear();
	let month = "" + (date.getUTCMonth() + 1);
	let day = "" + date.getUTCDate();
	let hour = "" + date.getUTCHours();
	let minute = "" + date.getUTCMinutes();
	let second = "" + date.getUTCSeconds();

  return `${year}-${fmt(month)}-${fmt(day)} ${fmt(hour)}:${fmt(minute)}:${fmt(second)}`;
}



export function dateTitleFormatter() {
	return {'daily': function (date) {
				let format = d3.time.format('%d of %b');
				return `on the ${format(date)}`;
			},
			'monthly' : function (date) {
				let format = d3.time.format('%B');
				return `at ${format(date)}`;
			}	
		}
}

export function numberScaleFormatter(number) {
	// number : number to format
	let format = d3.format('.3s');
	return format(number);


}

export function CustomFormatModule(formatSpecifier?:string) {

	let specifier = formatSpecifier || '.2s';
	let format = d3.format(specifier), noZeroFormat = function(x) { return format(x).replace(/\.0/, ""); };
	return {
		'getFunc': noZeroFormat,'getValue': (number) => noZeroFormat(number)
	}


}

 /**
     * Returns a function that receive number in Megas and then process it and gives the correspondig units..
*/
export function ManualMegaWattsFormater() {

        return function(numberInMegas) {
            let suffix = "Wh";
            
            if (numberInMegas >= 1000 && numberInMegas < 1000000) {
                return (numberInMegas / 1000).toFixed(1) + " G"+suffix;
            } else if ( numberInMegas >= 1000000 && numberInMegas < 1000000000) {
                return  (numberInMegas / 1000000).toFixed(1) + " T"+suffix;
            } else if (numberInMegas >= 1000000000) {
                return  (numberInMegas / 1000000000).toFixed(1) + " P"+suffix;
            } else {
                return numberInMegas.toFixed(1) + "M"+suffix;

            }
        }
    }



export function printTimestamp(timestamp) {
	return typeof timestamp === "string" ? printDate(new Date(timestamp)) : "";
}

export function fixTable(idContainer, idTable, firstCol, lastCol, idFooter?): void{

			let $table = $(idTable), numCols;

			// Calcule height of tbody
			let h;
			if (idFooter == undefined)
				h = $(idContainer).height() - $(idContainer + ' ' + idTable + ' thead').height() - 3;
			else
				h = $(idContainer).height() - $(idContainer + ' ' + idTable + ' thead').height() - $(idFooter).height() - 3;
					
			$(idContainer + ' ' + idTable + ' tbody').height(h);

			// Calcule width of thead
			if($(idContainer + ' ' + idTable + ' tbody')[0].scrollHeight > $(idContainer + ' ' + idTable + ' tbody')[0].clientHeight)
				$(idContainer + ' ' + idTable + ' thead').css('width','calc(100% - 10px)');
			else
				$(idContainer + ' ' + idTable + ' thead').css('width','100%');

			// Calcule bootstrap class to apply to each column
			numCols = $(idTable).find('tr')[0].cells.length;
			var i = 0;
			var widths = new Array(numCols-2);
			var widthFirst: number = firstCol;
			var widthLast: number = lastCol;

			// bootstrap works for 12 columns
			while(i < 12 - widthFirst - widthLast){
					if(widths[i%widths.length] == undefined)
							widths[i%widths.length] = 1;
					else
							widths[i%widths.length]=widths[i%widths.length]+1;
					i++;
			}

			// Set  the width of thead columns
			
			if($table.find('thead tr').children().first().attr('class') != undefined)
				$table.find('thead tr').children().first().attr('class',$table.find('thead tr').children().first().attr('class').replace( /(col-\w\w-\d\s?)+/ , '' )); 
			$table.find('thead tr').children().first().addClass("col-xs-"+widthFirst+" col-sm-"+widthFirst+" col-md-"+widthFirst+" col-lg-"+widthFirst);
			
			if($table.find('thead tr').children().last().attr('class') != undefined)
				$table.find('thead tr').children().last().attr('class',$table.find('thead tr').children().last().attr('class').replace( /(col-\w\w-\d\s?)+/ , '' ));
			$table.find('thead tr').children().last().addClass("col-xs-"+widthLast+" col-sm-"+widthLast+" col-md-"+widthLast+" col-lg-"+widthLast);
			
			$table.find('thead tr').children().each(function(i, v) {
					if(i!=0 && i!=numCols-1){
							v.className = v.className.replace( /(col-\w\w-\d\s?)+/ , '' );  
							v.classList.add("col-xs-"+widths[i-1], "col-sm-"+widths[i-1], "col-md-"+widths[i-1], "col-lg-"+widths[i-1]);
					}
			}); 
			
			// Set the width of tbody columns
			$table.find('tbody tr').children().each(function(i, v) {
					v.className = v.className.replace( /(col-\w\w-\d\s?)+/ , '' );
					if(i%numCols==0){
							v.classList.add("col-xs-"+widthFirst, "col-sm-"+widthFirst, "col-md-"+widthFirst, "col-lg-"+widthFirst);
					}else if(i%numCols == numCols-1){
							v.classList.add("col-xs-"+widthLast, "col-sm-"+widthLast, "col-md-"+widthLast, "col-lg-"+widthLast);
					}else{
							v.classList.add("col-xs-"+widths[(i-1)%numCols], "col-sm-"+widths[(i-1)%numCols], "col-md-"+widths[(i-1)%numCols], "col-lg-"+widths[(i-1)%numCols]);
					}
			});                  
}