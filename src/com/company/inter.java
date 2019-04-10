package com.company;

/**
 * Created by shao on 2019/2/25.
 * 当抽象类中的方法都是抽象的，那么该类可以通过接口的形式来表示
 * 用interface定义
 * 接口可以被类多实现，对java不支持多继承的转换形式
 */
interface  inter{
 public  static final  int mn = 3;
 public  abstract  void show();

}
interface intera extends inter{
    public abstract void showa();
}
//clas 类实现接口  extend继承
class face implements inter,intera {
    public void show() {
    }

    @Override
    public void showa(){}
}
class  interfacedemo{
    public static void main(String[] args) {
        face f = new face();
        System.out.println(f.mn);
        System.out.println(inter.mn);
        System.out.println(face.mn);
    }
}

