    <%@page session="false" %>
        <%@page import="java.net.*,java.io.*" %>
            <%!
String[] serverUrls = {
		  "http://192.168.0.199:8091/",
		  "http://192.168.0.33:8100/",
		  "http://api.map.baidu.com/"

};
%>
            <%
try {
  String reqUrl = request.getQueryString();

  boolean allowed = false;
  String token = null;
  for(String surl : serverUrls) {
    String[] stokens = surl.split("\\s*,\\s*");
    if(reqUrl.toLowerCase().contains(stokens[0].toLowerCase())) {
      allowed = true;
      if(stokens.length >= 2 && stokens[1].length() > 0)
        token = stokens[1];
      break;
    }
  }if(allowed){
    System.out.println("true");
  }
  else{
  System.out.println("false");
  }
  if(!allowed) {
    response.setStatus(403);
    return;
  }
  if(token != null) {
    reqUrl = reqUrl + (reqUrl.indexOf("?") > -1 ? "&" : "?") + "token=" + token;
  }
  System.out.println(reqUrl);
  URL url = new URL(reqUrl);
	HttpURLConnection con = (HttpURLConnection)url.openConnection();
	con.setDoOutput(true);
	con.setRequestMethod(request.getMethod());
	if(request.getContentType() != null) {
	  con.setRequestProperty("Content-Type", request.getContentType());
	  con.setRequestProperty("Access-Control-Allow-Origin", "*");
	}
  con.setRequestProperty("Referer", request.getHeader("Referer"));
	int clength = request.getContentLength();
	if(clength > 0) {
		con.setDoInput(true);
		InputStream istream = request.getInputStream();
		OutputStream os = con.getOutputStream();
		final int length = 5000;
	  byte[] bytes = new byte[length];
	  int bytesRead = 0;
	  while ((bytesRead = istream.read(bytes, 0, length)) > 0) {
	    os.write(bytes, 0, bytesRead);
	  }
	}
  else {
    con.setRequestMethod("GET");
  }
	out.clear();
  out = pageContext.pushBody();
	OutputStream ostream = response.getOutputStream();
	response.setContentType(con.getContentType());
	InputStream in = con.getInputStream();
	final int length = 5000;
  byte[] bytes = new byte[length];
  int bytesRead = 0;
  while ((bytesRead = in.read(bytes, 0, length)) > 0) {
    ostream.write(bytes, 0, bytesRead);
  }
} catch(Exception e) {
	response.setStatus(500);
}
%>
