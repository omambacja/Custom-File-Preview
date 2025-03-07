import { LightningElement, api,track } from "lwc";
import getSiteURL from '@salesforce/apex/GlobalUtility.getSiteURL'
import Max_Page from '@salesforce/label/c.Max_Page';

export default class FilePreviewModal extends LightningElement {

    @api fileExtension;
    @api contentVersionId;
    @api contentBodyId;
    @track urlList = [];
    @track pageSize = ['0'];
    showFrame = false;
    showModal = false;
    isLoading = false;
    isNoPreviewAvailabe = false;
    @track currentPage = 1;


    connectedCallback() {
      this.processPreviewFile();
    }

    processPreviewFile(){
        getSiteURL({})
        .then(result=>{
            this.processPageSize(result);
        })
        .catch(error=>{
            console.log(error.body.message)
        })
    }

    async processPageSize(siteURL) {
      const maxPages = Max_Page;
      let counter = 0;
      const urls = new Set();
      this.urlList = [];
      let finalContentVersionId = this.contentVersionId.slice(0, -3);
      let finalContentBodyId = this.contentBodyId.slice(0,-3);
      let isContinueProcess = true;
      let rendition = 'JVGZ';
      this.isLoading = true;
      this.isNoPreviewAvailabe = false;

      if (this.fileExtension === "doctype:pdf" || this.fileExtension === "doctype:excel"  || this.fileExtension === "doctype:word") {
        rendition = 'SVGZ';
      } else if(this.fileExtension === "doctype:image"){
        rendition = 'ORIGINAL_Png';
      } else {
        this.isNoPreviewAvailabe = true;
      }
    
      if(rendition !== 'ORIGINAL_Png'){
        let makeFetchRequest = async () => {
            if (counter < maxPages) {
                let documentURL = `${siteURL}sfc/servlet.shepherd/version/renditionDownload?rendition=${rendition}&versionId=${finalContentVersionId}&operationContext=CHATTER&contentId=${finalContentBodyId}&page=${this.pageSize[counter]}`;
                let response = await fetch(documentURL);
                let responseURL = `${siteURL}ex/errorduringprocessing.jsp`; 
                let isNeedReload = false;
                
                console.log('responseURL:'+responseURL);
                console.log('response URL:', response.url); 
                console.log('response:' + response.status);
               
              if(response.status === 202 && response.url !== responseURL){
                let responseBody = await response.json();
                let responseBodyMessage = JSON.stringify(responseBody.message);
                console.log('responseBody:'+ responseBodyMessage);
                
                isNeedReload = true; 
                //continue fetchrequest
                if (isContinueProcess && responseBodyMessage.includes("Creating renditions of the file.")) {
                  await makeFetchRequest();
                } else {
                  isNeedReload = false; 
                }

              } else {
                isNeedReload = false;
              }
               
              
              if(!isNeedReload){
                if (response.status === 200 && response.url !== responseURL) {
                    urls.add(documentURL);
                    this.pageSize.push(counter++);
                    // Continue making requests (recursion)
                    if (isContinueProcess) {
                        await makeFetchRequest();
                    }
                } else {

                   if(this.pageSize[counter] === '0'){
                      this.isNoPreviewAvailabe = true;
                   }
                    
                    console.log('response invalid');
                    // URL is not valid, stop making requests
                    this.pageSize.pop();
                    isContinueProcess = false;
                    this.isLoading = false;
                    return;
                }
              }
            } else {
                // Counter has reached the maximum number of pages, stop making requests
                isContinueProcess = false;
                this.isLoading = false;
                return;
            }
        }

        // Start making requests
        if (isContinueProcess) {
            await makeFetchRequest();
        }
    } else {
      let documentURL = `${siteURL}sfc/servlet.shepherd/version/renditionDownload?rendition=${rendition}&versionId=${finalContentVersionId}&operationContext=CHATTER&contentId=${finalContentBodyId}&page=${this.pageSize[counter]}`;
      urls.add(documentURL);
      this.isLoading = false;
    }

      this.urlList = urls;
  }

  @api show() {
    console.log("###showFrame : " + this.fileExtension);
    if (this.fileExtension === "doctype:pdf" || this.fileExtension === "doctype:excel" || this.fileExtension === "doctype:ppt" || this.fileExtension === "doctype:word") {
      this.showFrame = false;
    }
    else{
      this.showFrame = false;
    } 
    this.showModal = true;
  }

  @api closeModal() {
    this.showModal = false;
      const event  = new CustomEvent('closemodal', {
          detail : this.showModal
      });
      this.dispatchEvent(event );

  }
}