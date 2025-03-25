
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const NavBar: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // ดึงข้อมูลจาก profiles ถ้ามี
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
          
          if (data && !error) {
            setUsername(data.username);
          } else {
            // ถ้าไม่มีข้อมูลใน profiles ให้ใช้ email
            setUsername(user.email?.split('@')[0] || 'ผู้ใช้');
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    getProfile();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'ออกจากระบบสำเร็จ',
        description: 'ขอบคุณที่ใช้บริการ',
      });
      
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-sm">
      <h1 className="text-xl font-bold">Dentteamapp</h1>
      
      <div className="flex items-center space-x-2">
        {username && (
          <div className="flex items-center mr-2">
            <User className="h-4 w-4 mr-1 text-gray-500" />
            <span className={`${isMobile ? 'text-sm' : 'text-md'} text-gray-700`}>
              {username}
            </span>
          </div>
        )}
        
        <Button 
          onClick={handleLogout} 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-1" />
              <span>{isMobile ? 'ออก' : 'ออกจากระบบ'}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NavBar;
