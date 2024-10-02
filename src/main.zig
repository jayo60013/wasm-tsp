const std = @import("std");
var rndGen = std.rand.DefaultPrng.init(4);

const Point = struct {
    cx: f32,
    cy: f32,

    fn distance(self: *const Point, other: *const Point) f32 {
        const dx = self.cx - other.cx;
        const dy = self.cy - other.cy;
        return @sqrt(dx * dx + dy * dy);
    }
};

export fn initialisePoints(num_points: usize) [*]const Point {
    const allocator = std.heap.page_allocator;
    const rand = rndGen.random();

    const points = allocator.alloc(Point, num_points) catch unreachable;

    for (points) |*point| {
        point.cx = rand.float(f32);
        point.cy = rand.float(f32);
    }

    return points.ptr;
}

export fn getPointOrder(points: [*]const Point, num_points: usize) [*]const usize {
    const allocator = std.heap.page_allocator;
    const order = allocator.alloc(usize, num_points) catch unreachable;
    const visited = allocator.alloc(bool, num_points) catch unreachable;

    for (visited) |*v| {
        v.* = false;
    }

    var current_point_idx: usize = 0;
    visited[current_point_idx] = true;
    order[0] = current_point_idx;

    for (1..num_points) |i| {
        var nearest_point_idx: usize = 0;
        var nearest_dist: f32 = std.math.floatMax(f32);

        for (0..num_points) |j| {
            if (!visited[j]) {
                const dist = points[current_point_idx].distance(&points[j]);
                if (dist < nearest_dist) {
                    nearest_dist = dist;
                    nearest_point_idx = j;
                }
            }
        }

        visited[nearest_point_idx] = true;
        order[i] = nearest_point_idx;
        current_point_idx = nearest_point_idx;
    }

    return order.ptr;
}
