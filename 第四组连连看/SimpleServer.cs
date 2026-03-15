using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;

class SimpleServer
{
    static void Main()
    {
        var listener = new HttpListener();
        // 使用 localhost 需要管理员权限，使用 + 表示所有 IP
        listener.Prefixes.Add("http://127.0.0.1:3000/");
        listener.Start();
        
        Console.WriteLine("Server started at http://127.0.0.1:3000/");
        Console.WriteLine("Press Ctrl+C to stop");
        
        while (true)
        {
            try
            {
                var context = listener.GetContext();
                var request = context.Request;
                var response = context.Response;
                
                string url = request.Url.LocalPath;
                if (url == "/") url = "/index.html";
                
                string filePath = Path.Combine(Directory.GetCurrentDirectory(), url.TrimStart('/'));
                
                Console.WriteLine(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + request.HttpMethod + " " + url);
                
                if (File.Exists(filePath))
                {
                    byte[] content = File.ReadAllBytes(filePath);
                    response.ContentLength64 = content.Length;
                    response.OutputStream.Write(content, 0, content.Length);
                }
                else
                {
                    response.StatusCode = 404;
                    byte[] buffer = Encoding.UTF8.GetBytes("404 Not Found");
                    response.ContentLength64 = buffer.Length;
                    response.OutputStream.Write(buffer, 0, buffer.Length);
                }
                
                response.Close();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }
        }
    }
}
