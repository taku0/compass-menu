# -*- coding: utf-8 -*-

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# Script generating balloons and texts.

def min(x, y)
  if x < y
    x
  else
    y
  end
end

def escape(text)
  text = text.gsub("&", "&amp;")
  text = text.gsub("<", "&lt;")
  text = text.gsub(">", "&gt;")
  text = text.gsub("\"", "&quot;")
  text = text.gsub("\'", "&apos;")
  text
end

def round(value)
  "%.3f" % value
end

class Balloon
  INNER_RADIUS = 53
  OUTER_RADIUS = 56
  CENTER = [50, 50]
  HEIGHT = 22
  FONT_SZIE = HEIGHT - 6
  RECT_WIDTH = 120 - HEIGHT

  TAIL_POINTS =
    [
     [OUTER_RADIUS + 1, -3],
     [INNER_RADIUS, 0],
     [OUTER_RADIUS + 1, 3],
    ]

  def initialize(index)
    @index = index
  end

  def angle
    [0, 0, -20, 0, 0, 0, -20, 0][@index]
  end

  def rotation
    pi = Math.atan(1) * 4

    [Math.cos(2 * pi / 8 * @index), Math.sin(2 * pi / 8 * @index)]
  end

  def transformed_tail
    rotation = self.rotation

    TAIL_POINTS.map do |point|
      x = point[0] * rotation[0] - point[1] * rotation[1] + CENTER[0]
      y = point[0] * rotation[1] + point[1] * rotation[0] + CENTER[1]
      [x, y]
    end    
  end

  def tail_path_string
    transformed_tail = self.transformed_tail

    "M" + transformed_tail.map do |point|
      "#{round(point[0])},#{round(point[1])}"
    end.join(" ")
  end

  def start_circle_center
    rotation = self.rotation

    x = (OUTER_RADIUS + HEIGHT / 2.0) * rotation[0] + CENTER[0]
    y = (OUTER_RADIUS + HEIGHT / 2.0) * rotation[1] + CENTER[1]

    [x, y]
  end

  def end_circle_center
    x, y = start_circle_center

    x += [+RECT_WIDTH, +RECT_WIDTH, -RECT_WIDTH, -RECT_WIDTH, -RECT_WIDTH, -RECT_WIDTH, +RECT_WIDTH, +RECT_WIDTH][@index]

    [x, y]
  end

  def show_balloon(stroke, fill, out = $stdout)
    stroke_width_attribute =
      if stroke == "none"
        ""
      else
        " stroke-width=\"2\""
      end
    
    out.puts(%Q|<path d="#{tail_path_string}" stroke="#{stroke}"#{stroke_width_attribute} fill="#{fill}"/>|)

    start_circle_center = self.start_circle_center

    out.puts(%Q|<circle cx="#{round(start_circle_center[0])}" cy="#{round(start_circle_center[1])}" r="#{HEIGHT / 2.0}" stroke="#{stroke}"#{stroke_width_attribute} fill="#{fill}"/>|)

    end_circle_center = self.end_circle_center

    postfix =
      if stroke == 'none'
        "fill"
      else
        "stroke"
      end
    
    with_tilt(out) do
      out.puts(%Q|<circle id="circle_#{postfix}#{@index}" cx="#{round(end_circle_center[0])}" cy="#{round(end_circle_center[1])}" r="#{HEIGHT / 2.0}" stroke="#{stroke}"#{stroke_width_attribute} fill="#{fill}"/>|)
      out.puts(%Q|<rect id="rect_#{postfix}#{@index}" x="#{round(min(start_circle_center[0], end_circle_center[0]))}" y="#{round(start_circle_center[1] - HEIGHT / 2.0)}" width="#{RECT_WIDTH}" height="#{HEIGHT}" stroke="#{stroke}"#{stroke_width_attribute} fill="#{fill}"/>|)
    end
  end

  def with_tilt(out)
    angle = self.angle

    start_circle_center = self.start_circle_center

    if (angle != 0) 
      out.print(%Q|<g transform="rotate(#{angle}, #{round(start_circle_center[0])}, #{round(start_circle_center[1])})">|)
    end

    yield
    
    if (angle != 0) 
      out.puts(%Q|</g>|)
    end
  end

  def show_text(text, stroke, fill, out = $stdout)
    stroke_width_attribute =
      if stroke == "none"
        ""
      else
        " stroke-width=\"2\""
      end

    start_circle_center = self.start_circle_center
    end_circle_center = self.end_circle_center

    text_anchor = ['start', 'start', 'end', 'end', 'end', 'end', 'start', 'start'][@index]
    
    with_tilt(out) do
      out.puts(%Q|<text id="text#{@index}" x="#{round(start_circle_center[0])}" y="#{round(start_circle_center[1])}" font-size="#{FONT_SZIE}" stroke="#{stroke}"#{stroke_width_attribute} fill="#{fill}" text-anchor="#{text_anchor}" dominant-baseline="central">#{escape(text)}</text>|)
    end
  end
end

if ARGV[0] == 'balloon'
  0.upto(7) do |i|
    balloon = Balloon.new(i)
    
    puts(%Q|<g id="balloon#{i}">|)

    balloon.show_balloon("#C0C0C0", "none")
    balloon.show_balloon("none", "white")
    puts(%Q|</g>|)
  end
else
  0.upto(7) do |i|
    balloon = Balloon.new(i)

    balloon.show_text("Quick Brown Fog", "none", "#666666")
  end
end

puts
