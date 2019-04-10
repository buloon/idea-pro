package com.company;

/**
 * Created by shao on 2019/3/13.
 *
 * 匿名内部类要使用必须extend一个类
 */
public class Innerdemo {
    public static void main(String[] args) {
        fc f= new fc();
        f.function();
        
    }
}

   abstract class  fl{

    abstract   void  shou();

   }
     class  fc{

    int x = 8;

    /*class inner extends fl{
        void shou(){
            System.out.println(x);
        }
        void abc(){
            System.out.println("4")
         }
    }*/

      public void function(){
          fl df =new fl(){
              int x = 7;
            void shou(){
                System.out.println(x);
            }
            void  adc(){
                System.out.println("4");
            }
        };
          df.shou();
          //df.abc(); 父类中无abc方法，编译失败

       /* new  inner().shou();*/

    }

   }
