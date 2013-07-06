(function ($) {
    "use strict";
    var matchMixin = /^\s*([\.\#][^\[]*\)?)\s*[^\[]*\{$/,
        open_tags = [],
        prevline,
        prevmixin,
        section,
        fake = 0,
        sections = [],
        list = document.createDocumentFragment(),
        render,
        Mixin,
        matchLine,
        Section;

    Mixin = function (name) {
        this.codeLines = [];
        this.name = name.replace(/ \(/, "(");
        this.e = document.createElement("li");
        this.e.model = this;
        this.e.className = "mixin";
        var t = this;
        this.el = $(this.e).on("show", function () {
            return !t.parent || t.parent.el.show();
        }).on("click", function (e) {
            $(".hide:first", this).toggle(200);
            e.stopPropagation();
        }).one("mouseover", function () {
            // remove unneccessary spaces, join codelines, highlight comments
            var spaces = t.codeLines[0].search(/[^\ ]/);
            this.childNodes[1].innerHTML = t.codeLines.map(function (line) {
                return line.slice(spaces, line.length).replace(/\/\/ (.*)$/, "<i>// $1</i>");// highlight comments
            }).join("\n").replace(/@([A-Za-z\-]+)/g, "<span class='var muted'>$&</span>").replace(/\/\*(.*)\*\//g, "<i>/*$1*/</i>");
            delete t.codeLines;
        });
    };

    Mixin.prototype = {
        code: "",

        template: function () {
            this.e.innerHTML = "<span class='name'>" + this.name.replace(/@([A-Za-z\-]+)/g, "<span class='var muted'>$&</span><small> </small>")
                                + "</span><pre class='hide'></pre>";
        },

        add: function (ob) {
            if (!this.frag) this.frag = document.createDocumentFragment();
            this.frag.appendChild(ob.e);
            ob.parent = this;
        },

        render: function () {
            this.template();
            if (this.frag) {
                this.e.appendChild(this.frag);
                delete this.frag;
            }
            return this.e;
        }
    };

    Section = function (name) {
        this.name = name;
        var e = document.createElement("li");
        e.model = this;
        e.className =  "section";
        e.innerHTML = "<a name='{name}' href='#{name}'><h4>{name}</h4></a>".replace(/\{name\}/g, name);
        list.appendChild(e);
    };


    $.get("mixins.less", function (data) {
        var start = Date.now(), menu, options, searchList;

        // parse the source
        data.split("\n").forEach(function (line) {
            matchLine(line);
            prevline = line;
        });

        $(document).ready(function ($) {

            document.getElementById("list").appendChild(list);

            // show page when done creating it
            $("#wrapper, #footer").removeClass("hidden");

            options = document.createDocumentFragment();

            sections.forEach(function (s) {
                var op = document.createElement("option");
                op.textContent = s;
                op.value = "#" + s;
                options.appendChild(op);
            });

            searchList = $(".mixin, .section");

            $("#menu").change(function () {
                searchList.show();
                window.location = this.value;
            }).append(options);

            $("#searcher").on("keyup keydown", function () {
                if (this.value === "") return searchList.show();
                var reg = new RegExp(this.value, "i"); // it doesn't work when parent is hidden
                searchList.hide().filter(function (i, e) {
                    return reg.test(e.model.name);
                }).show().trigger("show").find(".mixin").show();
            });

            console.log("took " + (Date.now() - start) + "ms");

            if ($(window).width() > 767) {
                $("#content").animate({ pseudoShadow: 9}, { duration: 300, step: function (now, fx) {
                    var style = "box-shadow: 0 1px " + Math.floor(now) + "px #292929;";
                    style = style + "-moz-" + style + "-webkit-" + style;
                    this.setAttribute("style", style);
                }});
            }
        });
    });

    // Tip: using regexes to parse LESS was more complicated than it sounded.
    matchLine = function (line) {
        var sec, m, name, len, lm, last_open;
        if (/^\/\/\s+\-{10,60}$/.test(line)) {
            sec = /\/\/\s+([A-Z].*)$/.exec(prevline); // Matches Sections
            name = sec[1].toLowerCase();
            if (name === "mixins") return; // Don't need this section
            sections.push(name);
            sec = new Section(name);
            section = sec;
        } else if (lm = matchMixin.exec(line)) {// its a mixin
            m = new Mixin(lm[1]);
            if (open_tags.length === 0) {
                list.appendChild(m.e);
            } else {
                last_open = open_tags[open_tags.length - 1];
                if (last_open) {
                    last_open.add(m);
                }
            }
            open_tags.push(m);
        } else if (/\{/.test(line)) { // Matches other open brackets
            fake++;
        }
        // Add this line of code to every open mixin
        len = open_tags.length;
        while (len--) {
            open_tags[len].codeLines.push(line);
        }
        if (/\}/.test(line)) {
            if (!fake) {
                if (open_tags.length) {
                    open_tags.pop().render(); // remove from list
                }
            } else {
                fake--;
            }
        }
    };


}(jQuery));