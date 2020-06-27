auto = require("google-autocomplete");
auto.getQuerySuggestions("house", function (err, suggestions) {
  console.log(suggestions);
});
