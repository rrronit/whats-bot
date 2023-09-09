const puppeteer = require('puppeteer');

const startScraping = async (date) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() + date);

  await page.goto(`http://time-table.sicsr.ac.in/day.php?year=${dateObj.getFullYear()}&month=${dateObj.getMonth()+1}&day=${dateObj.getDate()}&area=1&room=29`);
  await page.waitForTimeout(2000);

  const links = [
    ...(await page.$$('a[title^="BCA III Div D"]')),
    ...(await page.$$('a[title^="BCA III  Div D"]')),
    ...(await page.$$('a[title^="BCA III  Div C+D"]')),
    ...(await page.$$('a[title^="Extra Lecture :BCA III Div D"]')),
    ...(await page.$$('a[title^="Extra Lecture :BCA III  Div D"]')),
  ];

  const infoArray = [];

  for (const link of links) {
    const linkText = await link.evaluate(el => el.href);
    const newPage = await browser.newPage(); 
    await newPage.goto(linkText);

    const value = await newPage.evaluate(() => {
      const subject = document.querySelector('h3').textContent.trim();
      const room = document.querySelectorAll('tr')[1].nextElementSibling.textContent.trim();
      const startTime = document.querySelectorAll('tr')[2].nextElementSibling.textContent.trim();
      const endTime = document.querySelectorAll('tr')[4].nextElementSibling.textContent.trim();

      return { subject, room, startTime, endTime };
    });

    infoArray.push(value);

    await newPage.waitForTimeout(2000);
    await newPage.close();
  }
 
 
  return infoArray;
};



  const filterData=(message)=>{
    timetable=[]
      message.forEach((item)=>{
  
      const subject=item.subject.split("-")[1];
      const startTime=item.startTime.split("-")[0].split("\n")[1]
      const endTime=item.endTime.split("-")[0].split("\n")[1]
      const room=item.room.split("-")[1]
      
      const cl={subject,startTime,endTime,room}
      if (timetable.length>0 && timetable[timetable.length-1].subject===subject){
        timetable[timetable.length-1].endTime=endTime
      }else{
        timetable.push(cl)
      }
      })
      return timetable
      
  }



const loginToWhatsapp = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://web.whatsapp.com');

   await page.waitForSelector('._8nE1Y');



  const checkForMessage = async (page) => {
    while (true) {
    
      try {
  
      const message = await page.evaluate(() => {
      const send = document.querySelectorAll('._8nE1Y');
      for (const element of send) {
      if (element.childNodes[0].childNodes[0].textContent.includes("Time table")) {
        const mes=element.childNodes[1].childNodes[0].textContent.split(":");
        if (mes.length>1){
          return mes[1];
        }
        return mes[0];
      }
   
      }
        return null; 
      });




       

        if (message.includes('/tt-')) {
          const contactName = "Time table";

          await page.waitForSelector(`span[title="${contactName}"]`);
          await page.click(`span[title="${contactName}"]`);



        
            const dayToSkip=parseInt(message.split("-")[1]);
            if (Number.isInteger(dayToSkip)) {
             
            
            const messageObj = await startScraping(dayToSkip);
            const filteredData= await filterData(messageObj)
            const dateObj=new Date()
            dateObj.setDate(dateObj.getDate()+dayToSkip);
            const weekDays=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];  

            
           
            let messageStr =`${weekDays[dateObj.getDay()]} (${dateObj.getDate()} ${months[dateObj.getMonth()]}) \n`
            if (filteredData.length>0){

            
            messageStr+=filteredData.map(item => {
              return `${item.startTime} to ${item.endTime}-${item.subject}-${item.room}`;
            }).join('\n'); 
          }
          else{

            messageStr+="Holiday";
          }

            await page.keyboard.type(messageStr);
            await page.keyboard.press('Enter');
        }
            

            
        }

        else if (message.includes('/tt')) {
          const contactName = "Time table";

          await page.waitForSelector(`span[title="${contactName}"]`);
          await page.click(`span[title="${contactName}"]`);

        
        
            const messageObj = await startScraping(0);
            const filteredData= await filterData(messageObj)
            const dateObj=new Date()
            const weekDays=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];  

           
            let messageStr =`${weekDays[dateObj.getDay()]} (${dateObj.getDate()} ${months[dateObj.getMonth()]}) \n`
          
            if (filteredData.length>0){

            
            messageStr+=filteredData.map(item => {
              return `${item.startTime} to ${item.endTime}-${item.subject}-${item.room}`;
            }).join('\n'); 
          }
          else{
            messageStr="Holiday";
          }

   
            await page.keyboard.type(messageStr);
            await page.keyboard.press('Enter');
                
        }
      } catch (error) {
        console.error('Error:', error);
      }
      await page.waitForTimeout(1000);
    }
  };
  checkForMessage(page);
};

loginToWhatsapp();
 