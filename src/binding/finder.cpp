// finder.cpp
// node binding of forbidden point finder, written in C++
// author: tc-imba (https://github.com/tc-imba)

#include <node.h>
#include <node_buffer.h>
#include <iostream>

#include "../../forbidden-point-finder/ForbiddenPointFinder.h"

using namespace v8;
using namespace std;
using namespace node;

ForbiddenPointFinder finder;

void Clear(const FunctionCallbackInfo<Value> &args) {
    finder.clear();
}

void AddStone(const FunctionCallbackInfo<Value> &args) {
    auto isolate = args.GetIsolate();
    if (args.Length() < 2) {
        isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments")));
        return;
    }
    if (!args[0]->IsInt32() || !args[1]->IsInt32() || !args[2]->IsString()) {
        isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong arguments")));
        return;
    }
    auto x = args[0]->IntegerValue();
    auto y = args[1]->IntegerValue();
    String::Utf8Value color(args[2]);
    string str(*color);
    ForbiddenPointFinder::Result result;
    if (str == "black") {
        //cout << "black" << endl;
        result = finder.addStone(x, y, ForbiddenPointFinder::Stone::Black);
    } else {
        //cout << "white" << endl;
        result = finder.addStone(x, y, ForbiddenPointFinder::Stone::White);
    }
    switch (result) {
        case ForbiddenPointFinder::Result::BlackWin:
            args.GetReturnValue().Set(String::NewFromUtf8(isolate, "blackwin"));
            break;
        case ForbiddenPointFinder::Result::WhiteWin:
            args.GetReturnValue().Set(String::NewFromUtf8(isolate, "whitewin"));
            break;
        case ForbiddenPointFinder::Result::Forbidden:
            args.GetReturnValue().Set(String::NewFromUtf8(isolate, "forbidden"));
            break;
        case ForbiddenPointFinder::Result::UNKNOWN:
            args.GetReturnValue().Set(String::NewFromUtf8(isolate, "unknown"));
            break;
    }
}

void init(Local<Object> exports) {
    NODE_SET_METHOD(exports, "clear", Clear);
    NODE_SET_METHOD(exports, "addStone", AddStone);
}

NODE_MODULE(forbidden_point_finder, init);
