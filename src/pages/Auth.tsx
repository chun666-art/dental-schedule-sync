
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// กำหนดรูปแบบของข้อมูลและการตรวจสอบ
const formSchema = z.object({
  username: z.string().min(3, {
    message: 'กรุณากรอกชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร',
  }),
  password: z.string().min(6, {
    message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
  }),
});

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // ตรวจสอบสถานะการล็อกอิน
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };

    checkSession();

    // ติดตามการเปลี่ยนแปลงสถานะการล็อกอิน
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // กำหนดค่าเริ่มต้นของฟอร์ม
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // ฟังก์ชันสำหรับการล็อกอิน
  const handleLogin = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.username, // ใช้ username เป็น email
        password: values.password,
      });

      if (error) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: error.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'เข้าสู่ระบบสำเร็จ',
        description: 'ยินดีต้อนรับกลับมา',
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับการสมัครสมาชิก
  const handleSignUp = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: values.username, // ใช้ username เป็น email
        password: values.password,
        options: {
          data: {
            username: values.username,
          },
        },
      });

      if (error) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: error.message || 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'สมัครสมาชิกสำเร็จ',
        description: 'กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันการสมัครสมาชิก',
      });
      
      // สลับกลับไปหน้าล็อกอิน
      setIsSignUp(false);
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isSignUp) {
      handleSignUp(values);
    } else {
      handleLogin(values);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Dentteamapp</h1>
          <p className="mt-2 text-gray-600">
            {isSignUp ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบเพื่อใช้งาน'}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อผู้ใช้</FormLabel>
                  <FormControl>
                    <Input placeholder="กรอกชื่อผู้ใช้" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสผ่าน</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="กรอกรหัสผ่าน" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : isSignUp ? 'ลงทะเบียน' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </Form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-600 hover:underline"
          >
            {isSignUp ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? ลงทะเบียน'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
