import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, name, classCode, studentId, classId, preferences, additionalComments } = await req.json();
    
    console.log(`Student auth action: ${action}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (action === 'login') {
      // Validate inputs
      if (!name?.trim() || !classCode?.trim()) {
        return new Response(
          JSON.stringify({ error: 'Name and class code are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify class exists by class code
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('class_code', classCode.trim().toUpperCase())
        .maybeSingle();

      if (classError) {
        console.error('Class lookup error:', classError);
        return new Response(
          JSON.stringify({ error: 'Error checking class code' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!classData) {
        return new Response(
          JSON.stringify({ error: 'Invalid class code' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if student exists in this class (case-insensitive)
      const { data: existingStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .eq('class_id', classData.id);

      if (studentsError) {
        console.error('Student lookup error:', studentsError);
        return new Response(
          JSON.stringify({ error: 'Error checking students' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let studentRecord = existingStudents?.find(
        s => s.name.toLowerCase() === name.trim().toLowerCase()
      );

      let hasExistingPreferences = false;

      // If student doesn't exist, create them
      if (!studentRecord) {
        const normalizedName = name.trim()
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        const { data: newStudent, error: insertError } = await supabase
          .from('students')
          .insert({
            class_id: classData.id,
            name: normalizedName,
            auth_user_id: null
          })
          .select('id, name')
          .single();

        if (insertError) {
          console.error('Student insert error:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to create student record' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        studentRecord = newStudent;
      } else {
        // Check if student has existing preferences
        const { data: existingPrefs } = await supabase
          .from('student_preferences')
          .select('id')
          .eq('student_id', studentRecord.id)
          .eq('class_id', classData.id)
          .limit(1);

        hasExistingPreferences = !!(existingPrefs && existingPrefs.length > 0);
      }

      // Generate a session token for server-side verification
      const sessionToken = crypto.randomUUID();
      
      console.log(`Student login successful: ${studentRecord.name} in class ${classData.name}`);

      return new Response(
        JSON.stringify({
          student: {
            id: studentRecord.id,
            name: studentRecord.name,
            class_id: classData.id,
            class_name: classData.name,
            session_token: sessionToken
          },
          hasExistingPreferences
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'submit_preferences') {
      // Validate required inputs
      if (!studentId || !classId || !preferences) {
        return new Response(
          JSON.stringify({ error: 'Student ID, class ID, and preferences are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify student exists and belongs to the class (server-side validation)
      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .select('id, name, class_id')
        .eq('id', studentId)
        .eq('class_id', classId)
        .maybeSingle();

      if (studentError || !studentRecord) {
        console.error('Student verification failed:', studentError);
        return new Response(
          JSON.stringify({ error: 'Invalid student or class' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert new preferences (always insert, let teachers manage old ones)
      const { error: insertError } = await supabase
        .from('student_preferences')
        .insert({
          student_id: studentId,
          class_id: classId,
          preferences: preferences,
          additional_comments: additionalComments || null,
          status: 'pending'
        });

      if (insertError) {
        console.error('Preference insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to submit preferences' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Preferences submitted for student: ${studentRecord.name}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'get_class_settings') {
      // Get class settings - requires valid student/class IDs
      if (!studentId || !classId) {
        return new Response(
          JSON.stringify({ error: 'Student ID and class ID are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify student belongs to class
      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('class_id', classId)
        .maybeSingle();

      if (studentError || !studentRecord) {
        return new Response(
          JSON.stringify({ error: 'Invalid student or class' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get class settings
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('max_preferences, name, allow_gender_preference, allow_seating_position, allow_avoid_students')
        .eq('id', classId)
        .single();

      if (classError || !classData) {
        return new Response(
          JSON.stringify({ error: 'Class not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get previous preferences
      const { data: prefData } = await supabase
        .from('student_preferences')
        .select('preferences, additional_comments')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          classSettings: classData,
          previousPreferences: prefData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Student auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
