// Supabase Calendar Service
import supabase from './supabaseClient';

// Get today's calendar events
export const getTodayEvents = async () => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated to access calendar');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Format events for frontend
    const formattedEvents = data.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      startTime: new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: event.location || '',
      participants: event.participants || []
    }));

    return { data: formattedEvents, error: null };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return { data: null, error };
  }
};

// Create a new calendar event
export const createEvent = async (event) => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated to create events');

    const newEvent = {
      ...event,
      user_id: user.id
    };

    const { data, error } = await supabase
      .from('calendar_events')
      .insert([newEvent])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { data: null, error };
  }
};

export default {
  getTodayEvents,
  createEvent
};