package com.jihelist;
/*
add方法的参数是object；集合内存储的是对象的引用（地址）
*/
import java.util.ArrayList;

public class collecctdemo {
    public static void main(String[] args) {
        //创建一个集合容器，使用Collection接口子类，ArrayList
        ArrayList al= new ArrayList();
        al.add("java1");//add(Object object）
        al.add("java02");
        sout(al);
        sout(al.size());
        sout(al.contains("java"));
        sout(al.isEmpty());
        al.clear();
    }



    public static  void  sout(Object object){
        System.out.println(object);
    }

}



