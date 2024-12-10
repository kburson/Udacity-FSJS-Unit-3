## terminate background process

lsof -i tcp:3000

netstat -vanp tcp | grep 3000

kill -9 <PID>

pm.environment.set("AUTH_HEADER", "variable_value");
pm.test("Content-Type is present", function () {
pm.response.to.have.header("Content-Type");
});
