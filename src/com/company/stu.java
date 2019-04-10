package com.company;

/**
 * Created by shao on 2019/2/26.
 */
abstract class stu {
    abstract void study();
    void  sleep(){
        System.out.println("dd");
    }

}
interface smk{
    public  void smking();
}
  abstract class zs extends stu implements smk{
        @Override
      void study(){};
        void sleep(){

        };
       public void smking(){};
}