// A user-entered key stays in this tab and is used only for Google Maps requests.
try {
 const customKey=sessionStorage.getItem('wakl-google-key');
 if(customKey)GOOGLE_MAP_CONFIGURATION.mapsApiKey=customKey;
}catch{}
