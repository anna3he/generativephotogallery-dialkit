export interface ColorTokens {
  bg:    string
  bg2:   string
  bg3:   string
  t1:    string
  t2:    string
  t3:    string
  t4:    string
  line:  string
  line2: string
}

const night: ColorTokens = {
  bg:    '#111111',
  bg2:   '#252525',
  bg3:   '#303030',
  t1:    '#FAFAFA',
  t2:    '#CCCCCC',
  t3:    '#AAAAAA',
  t4:    '#777777',
  line:  '#383838',
  line2: '#4A4A4A',
}

const light: ColorTokens = {
  bg:    '#F9F9F9',
  bg2:   '#F2F2F2',
  bg3:   '#EBEBEB',
  t1:    '#0A0A0A',
  t2:    '#444444',
  t3:    '#767676',
  t4:    '#AAAAAA',
  line:  '#E8E8E8',
  line2: '#DADADA',
}

export function getColors(nightMode: boolean): ColorTokens {
  return nightMode ? night : light
}
