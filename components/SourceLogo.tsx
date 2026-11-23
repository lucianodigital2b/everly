import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Users } from 'lucide-react-native';
import { colors } from '../constants/colors';

/**
 * Brand marks for the "how did you hear about Everly" wizard step, in their
 * own colours. Keyed by the option ids in SOURCE_OPTIONS (app/(tabs)/plan.tsx).
 * Ported from DailyHair, plus Pinterest, App Store and friend.
 */

const TIKTOK =
  'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';

const PINTEREST =
  'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z';

const APP_STORE =
  'M8.8086 14.9194l6.1107-11.0368c.0837-.1513.1682-.302.2437-.4584.0685-.142.1267-.2854.1646-.4403.0803-.3259.0588-.6656-.066-.9767-.1238-.3095-.3417-.5678-.6201-.7355a1.4175 1.4175 0 0 0-.921-.1924c-.3207.043-.6135.1935-.8443.4288-.1094.1118-.1996.2361-.2832.369-.092.1463-.175.2979-.259.4492l-.3864.6979-.3865-.6979c-.0837-.1515-.1667-.303-.2587-.4492-.0837-.1329-.1739-.2572-.2835-.369-.2305-.2353-.5233-.3857-.844-.429a1.4181 1.4181 0 0 0-.921.1926c-.2784.1677-.4964.426-.6203.7355-.1246.311-.1461.6508-.066.9767.038.155.0962.2984.1648.4403.0753.1564.1598.307.2437.4584l1.248 2.2543-4.8625 8.7825H2.0295c-.1676 0-.3351-.0007-.5026.0092-.1522.009-.3004.0284-.448.0714-.3108.0906-.5822.2798-.7783.548-.195.2665-.3006.5929-.3006.9279 0 .3352.1057.6612.3006.9277.196.2683.4675.4575.7782.548.1477.043.296.0623.4481.0715.1675.01.335.009.5026.009h13.0974c.0171-.0357.059-.1294.1-.2697.415-1.4151-.6156-2.843-2.0347-2.843zM3.113 18.5418l-.7922 1.5008c-.0818.1553-.1644.31-.2384.4705-.067.1458-.124.293-.1611.452-.0785.3346-.0576.6834.0645 1.0029.1212.3175.3346.583.607.7549.2727.172.5891.2416.9013.1975.3139-.044.6005-.1986.8263-.4402.1072-.1148.1954-.2424.2772-.3787.0902-.1503.1714-.3059.2535-.4612L6 19.4636c-.0896-.149-.9473-1.4704-2.887-.9218m20.5861-3.0056a1.4707 1.4707 0 0 0-.779-.5407c-.1476-.0425-.2961-.0616-.4483-.0705-.1678-.0099-.3352-.0091-.503-.0091H18.648l-4.3891-7.817c-.6655.7005-.9632 1.485-1.0773 2.1976-.1655 1.0333.0367 2.0934.546 3.0004l5.2741 9.3933c.084.1494.167.299.2591.4435.0837.131.1739.2537.2836.364.231.2323.5238.3809.8449.4232.3192.0424.643-.0244.9217-.1899.2784-.1653.4968-.4204.621-.7257.1246-.3072.146-.6425.0658-.9641-.0381-.1529-.0962-.2945-.165-.4346-.0753-.1543-.1598-.303-.2438-.4524l-1.216-2.1662h1.596c.1677 0 .3351.0009.5029-.009.1522-.009.3007-.028.4483-.0705a1.4707 1.4707 0 0 0 .779-.5407A1.5386 1.5386 0 0 0 24 16.452a1.539 1.539 0 0 0-.3009-.9158Z';

type LogoProps = { size: number };

function TikTok({ size }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width={24} height={24} rx={6} fill="#000000" />
      <G transform="translate(5.04 5.04) scale(0.58)">
        <Path d={TIKTOK} fill="#25F4EE" transform="translate(-0.9 -0.9)" />
        <Path d={TIKTOK} fill="#FE2C55" transform="translate(0.9 0.9)" />
        <Path d={TIKTOK} fill="#FFFFFF" />
      </G>
    </Svg>
  );
}

function Instagram({ size }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <RadialGradient id="ig" cx="30%" cy="107%" r="150%">
          <Stop offset="0" stopColor="#FDF497" />
          <Stop offset="0.05" stopColor="#FDF497" />
          <Stop offset="0.45" stopColor="#FD5949" />
          <Stop offset="0.6" stopColor="#D6249F" />
          <Stop offset="0.9" stopColor="#285AEB" />
        </RadialGradient>
      </Defs>
      <Rect width={24} height={24} rx={6} fill="url(#ig)" />
      <Rect x={5} y={5} width={14} height={14} rx={4.2} fill="none" stroke="#FFFFFF" strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={3.3} fill="none" stroke="#FFFFFF" strokeWidth={1.8} />
      <Circle cx={16.1} cy={7.9} r={1.05} fill="#FFFFFF" />
    </Svg>
  );
}

function Pinterest({ size }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* White behind the cut-out "P", so it stays white on a tinted row. */}
      <Circle cx={12} cy={12} r={11.5} fill="#FFFFFF" />
      <Path d={PINTEREST} fill="#E60023" />
    </Svg>
  );
}

function AppStore({ size }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="as" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1AC8FC" />
          <Stop offset="1" stopColor="#1C6CF0" />
        </LinearGradient>
      </Defs>
      <Rect width={24} height={24} rx={6} fill="url(#as)" />
      <G transform="translate(5 5) scale(0.5833)">
        <Path d={APP_STORE} fill="#FFFFFF" />
      </G>
    </Svg>
  );
}

function Google({ size }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

function Friend({ size }: LogoProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accentBright,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Users size={size * 0.56} color={colors.accentDeep} strokeWidth={2.2} />
    </View>
  );
}

function Other({ size }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={12} fill={colors.surface2} />
      <Circle cx={7} cy={12} r={1.6} fill={colors.textSecondary} />
      <Circle cx={12} cy={12} r={1.6} fill={colors.textSecondary} />
      <Circle cx={17} cy={12} r={1.6} fill={colors.textSecondary} />
    </Svg>
  );
}

const LOGOS: Record<string, (props: LogoProps) => React.JSX.Element> = {
  tiktok: TikTok,
  instagram: Instagram,
  pinterest: Pinterest,
  app_store: AppStore,
  google: Google,
  friend: Friend,
  other: Other,
};

/** The logo for an option id, or null when it has none. */
export function SourceLogo({ option, size = 28 }: { option: string; size?: number }) {
  const Logo = LOGOS[option];
  return Logo ? <Logo size={size} /> : null;
}
